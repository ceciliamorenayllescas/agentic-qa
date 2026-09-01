/** The small, feature-agnostic contract between Test Design and Playwright. */
export type ValueSource =
  | { type: 'literal'; value: string | number }
  | { type: 'environment'; key: string }
  | { type: 'test_data'; key: string }
  | { type: 'runtime'; key: string };

export type AutomationAction =
  | { type: 'navigate'; target: string }
  | { type: 'click'; target: string; value_source?: ValueSource }
  | { type: 'fill'; target: string; value_source: ValueSource }
  | { type: 'fill_form'; target: string; value_source: ValueSource }
  | { type: 'select'; target: string; value_source: ValueSource }
  | { type: 'read'; target: string; save_as: string; index?: number }
  | { type: 'read_collection'; target: string; save_as: string; value_type?: 'string' | 'number' }
  | { type: 'select_random_items'; target: string; count: number; unique: true; save_as: string }
  | { type: 'add_items'; target: string; value_source: ValueSource }
  | { type: 'read_badge'; target: string; save_as: string }
  | { type: 'reuse'; target: string; value_source: ValueSource }
  | { type: 'assert_visible' | 'assert_hidden'; target: string }
  | { type: 'assert_text' | 'assert_contains' | 'assert_equals' | 'assert_array_equal'; target: string; actual_from?: string; expected?: string | ValueSource }
  | { type: 'assert_url'; target: string }
  | { type: 'assert_collection_ascending' | 'assert_collection_descending'; actual_from: string; value_type?: 'string' | 'number' };

export interface AutomationPlan {
  schema_version: '1.0';
  test_case_id: string;
  actions: AutomationAction[];
  coverage: Array<{ step_index: number; expected_result: string; action_indexes: number[] }>;
}

export interface TestCaseForPlanning {
  id: string; title: string; steps: Array<Record<string, unknown>>; expected_results: string[];
}

const runtime = (key: string): ValueSource => ({ type: 'runtime', key });
const testData = (key: string): ValueSource => ({ type: 'test_data', key });

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function collectionTarget(step: Record<string, unknown>): 'inventory.product_names' | 'inventory.product_prices' | null {
  const collection = normalized(`${String(step.collection ?? '')} ${String(step.action ?? '')} ${String(step.expected_result ?? '')}`);
  if (step.value_type === 'number' || /price|precio|numeric|numerico|low to high|high to low/.test(collection)) return 'inventory.product_prices';
  if (/name|nombre|alphabetical|alfabet/.test(collection)) return 'inventory.product_names';
  return null;
}

function sortValue(value: string): 'az' | 'za' | 'lohi' | 'hilo' | null {
  const text = normalized(value).replace(/[^a-z0-9]+/g, ' ');
  const ascending = /ascending|ascendente|a to z|low to high|menor a mayor|low high/.test(text);
  const descending = /descending|descendente|z to a|high to low|mayor a menor|high low/.test(text);
  if (/name|nombre/.test(text)) return ascending ? 'az' : descending ? 'za' : null;
  if (/price|precio/.test(text)) return ascending ? 'lohi' : descending ? 'hilo' : null;
  return null;
}

function planStep(step: Record<string, unknown>, actions: AutomationAction[]): boolean {
  const text = String(step.action ?? '').toLowerCase();
  const observation = String(step.expected_result ?? '').toLowerCase();
  const operation = String(step.operation ?? '');
  if (operation === 'select_option') {
    const value = sortValue(String(step.value ?? '') || text);
    if (!value) return false;
    actions.push({ type: 'select', target: 'inventory.sort', value_source: { type: 'literal', value } });
    return true;
  }
  if (operation === 'assert_collection_order') {
    const target = collectionTarget(step);
    const order = String(step.order ?? '').toLowerCase();
    if (!target || !['ascending', 'descending'].includes(order)) return false;
    const current = target === 'inventory.product_prices' ? 'current_product_prices' : 'current_product_names';
    actions.push(
      { type: 'read_collection', target, save_as: current, value_type: target === 'inventory.product_prices' ? 'number' : 'string' },
      { type: order === 'descending' ? 'assert_collection_descending' : 'assert_collection_ascending', actual_from: current, value_type: target === 'inventory.product_prices' ? 'number' : 'string' },
    ); return true;
  }
  if (operation === 'read_collection') {
    const target = collectionTarget(step);
    if (!target) return false;
    actions.push({ type: 'read_collection', target, save_as: String(step.variable ?? 'actual'), value_type: target === 'inventory.product_prices' ? 'number' : 'string' });
    return true;
  }
  if (/select (three|3|two|2|n|[0-9]+).*?(random|different|unique)|random.*(products|items)|tres.*producto.*(aleator|diferente)/.test(text)) {
    const match = text.match(/\b(\d+)\b/);
    const count = match ? Number(match[1]) : /three|tres/.test(text) ? 3 : 2;
    actions.push({ type: 'select_random_items', target: 'inventory.products', count, unique: true, save_as: 'selectedProducts' }); return true;
  }
  if (/add each|add the selected|agregar.*seleccion/.test(text)) { actions.push({ type: 'add_items', target: 'inventory.cart', value_source: runtime(String(step.variable ?? 'selectedProducts')) }); return true; }
  if (/quantity indicator|badge|cart.*reflects|indicador.*carrito/.test(text)) { actions.push({ type: 'read_badge', target: 'inventory.cart_badge', save_as: 'cartCount' }, { type: 'assert_equals', target: 'inventory.cart_badge', actual_from: 'cartCount', expected: { type: 'literal', value: 3 } }); return true; }
  if (/record.*two|names of two|dos distinct/.test(text)) { actions.push({ type: 'read', target: 'inventory.product_name', save_as: 'selectedProduct', index: 0 }, { type: 'read', target: 'inventory.product_name', save_as: 'secondProduct', index: 1 }); return true; }
  if (/authenticate|login|credencial/.test(text)) {
    actions.push({ type: 'navigate', target: 'login.home' }, { type: 'fill_form', target: 'login.credentials', value_source: { type: 'environment', key: 'standardUserCredentials' } }, { type: 'assert_url', target: 'inventory.url' }, { type: 'assert_visible', target: 'inventory.heading' }); return true;
  }
  if (/visible products|confirm.*authenticated|inventory is displayed|sesi[oó]n iniciada/.test(`${text} ${observation}`)) { actions.push({ type: 'assert_visible', target: 'inventory.heading' }); return true; }
  if (/hamburger|menu/.test(text)) { actions.push({ type: 'click', target: 'navigation.menu' }, { type: 'assert_visible', target: 'navigation.logout' }); return true; }
  if (/logout|log out|cerrar sesi/.test(text)) { actions.push({ type: 'click', target: 'navigation.logout' }, { type: 'assert_url', target: 'login.home' }, { type: 'assert_visible', target: 'login.form' }); return true; }
  if (/add.*first.*product|first.*add/.test(text)) { actions.push({ type: 'click', target: 'inventory.add_product', value_source: runtime('selectedProduct') }); return true; }
  if (/^record|one visible|first selected/.test(text) && /product|producto/.test(text)) { actions.push({ type: 'read', target: 'inventory.product_name', save_as: 'selectedProduct', index: 0 }); if (/select|add it|agregar|add one/.test(text)) actions.push({ type: 'click', target: 'inventory.add_product', value_source: runtime('selectedProduct') }); if (/open.*cart/.test(text)) actions.push({ type: 'click', target: 'inventory.cart' }, { type: 'assert_visible', target: 'cart.heading' }); return true; }
  if (/add.*second|different.*product|second.*add/.test(text)) { if (/return|back/.test(text)) actions.push({ type: 'click', target: 'cart.continue' }); if (/different/.test(text)) actions.push({ type: 'read', target: 'inventory.product_name', save_as: 'secondProduct', index: 1 }); actions.push({ type: 'click', target: 'inventory.add_product', value_source: runtime('secondProduct') }); return true; }
  if (/add.*product|agregar.*producto/.test(text)) { if (/agregar un producto|add one/.test(text)) actions.push({ type: 'read', target: 'inventory.product_name', save_as: 'selectedProduct', index: 0 }); actions.push({ type: 'click', target: 'inventory.add_product', value_source: runtime('selectedProduct') }); return true; }
  if (/open.*cart|shopping cart|acceder al carrito|carrito/.test(text)) { actions.push({ type: 'click', target: 'inventory.cart' }, { type: 'assert_visible', target: 'cart.heading' }); if (/display|reflect|product|producto/.test(text)) actions.push({ type: 'read', target: 'cart.product_names', save_as: 'cartProducts' }, { type: 'assert_contains', target: 'cart.product_names', actual_from: 'cartProducts', expected: runtime('selectedProduct') }); return true; }
  if (/read.*product names.*cart|cart.*as.*product|nombres.*carrito/.test(text)) { actions.push({ type: 'read', target: 'cart.product_names', save_as: String(step.variable ?? 'cartProducts') }); return true; }
  if (/compare.*cart|same three.*cart|carrito.*mism|mismos.*carrito/.test(text)) { actions.push({ type: 'assert_array_equal', target: 'cart.product_names', actual_from: 'cartProductNames', expected: runtime('selectedProductNames') }); return true; }
  if (/read.*product names.*overview|overview.*as.*product|nombres.*overview/.test(text)) { actions.push({ type: 'read', target: 'checkout.product_names', save_as: String(step.variable ?? 'overviewProductNames') }); return true; }
  if (/compare.*overview|same three.*overview|overview.*same|mismos.*overview/.test(text)) { actions.push({ type: 'assert_array_equal', target: 'checkout.product_names', actual_from: 'overviewProductNames', expected: runtime('selectedProductNames') }); return true; }
  if (/finalize|finish|finalizar/.test(text)) { actions.push({ type: 'click', target: 'checkout.finish' }); return true; }
  if (/continue.*checkout|checkout overview|continuar.*checkout|summary|resumen/.test(text)) { actions.push({ type: 'click', target: 'checkout.continue' }, { type: 'assert_visible', target: 'checkout.summary' }); return true; }
  if (/confirmation|confirmaci[oó]n/.test(text)) { actions.push({ type: 'assert_text', target: 'checkout.confirmation', expected: 'Thank you for your order!' }); return true; }
  if (/checkout|iniciar/.test(text)) { actions.push({ type: 'click', target: 'cart.checkout' }); return true; }
  if (/buyer|customer|datos requeridos/.test(text)) { actions.push({ type: 'fill_form', target: 'checkout.customer_information', value_source: testData('checkoutCustomer') }); return true; }
  if (/selected product.*summary|producto seleccionado.*resumen/.test(text)) { actions.push({ type: 'read', target: 'checkout.product_names', save_as: 'summaryProducts' }, { type: 'assert_contains', target: 'checkout.product_names', actual_from: 'summaryProducts', expected: runtime('selectedProduct') }); return true; }
  if (/continue|continuar|summary|resumen/.test(text)) { actions.push({ type: 'click', target: 'checkout.continue' }, { type: 'assert_visible', target: 'checkout.summary' }); return true; }
  if (/finish|finalizar/.test(text)) { actions.push({ type: 'click', target: 'checkout.finish' }); return true; }
  if (/read.*collection|visible collection/.test(text)) { const target = collectionTarget(step); if (!target) return false; actions.push({ type: 'read_collection', target, save_as: 'actual', value_type: target === 'inventory.product_prices' ? 'number' : 'string' }); return true; }
  return false;
}

export function buildAutomationPlan(testCase: TestCaseForPlanning): AutomationPlan | { unsupported_step: number; unsupported_operation: string; reason: string } {
  const actions: AutomationAction[] = [];
  const coverage: AutomationPlan['coverage'] = [];
  for (let i = 0; i < testCase.steps.length; i += 1) {
    const start = actions.length;
    const supported = planStep(testCase.steps[i], actions);
    if (!supported) return { unsupported_step: i, unsupported_operation: String(testCase.steps[i].action ?? 'unknown'), reason: `No capability is registered for this semantic operation.` };
    coverage.push({ step_index: i, expected_result: String(testCase.steps[i].expected_result ?? ''), action_indexes: actions.slice(start).map((_, index) => start + index) });
  }
  if (testCase.expected_results.length > 0 && coverage.some((item) => item.action_indexes.length === 0)) return { unsupported_step: coverage.findIndex((item) => item.action_indexes.length === 0), unsupported_operation: 'expected_result', reason: 'Expected result has no observable operation.' };
  return { schema_version: '1.0', test_case_id: testCase.id, actions, coverage };
}
