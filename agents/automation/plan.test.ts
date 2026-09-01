import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseUnique, createSeededRandom } from '../../helpers/random.js';
import { buildAutomationPlan, type TestCaseForPlanning } from './plan.js';

function tc(steps: Array<Record<string, unknown>>): TestCaseForPlanning { return { id: 'TC-UNIT', title: 'unit', steps, expected_results: ['observable'] }; }

test('normalizes random product selection and runtime references', () => {
  const plan = buildAutomationPlan(tc([
    { action: 'Select three different products at runtime from visibleProducts.', expected_result: 'selectedProductNames contains three unique names.' },
    { action: 'Add each product in selectedProductNames to the cart.', expected_result: 'Each selected product is added.' },
  ]));
  assert.equal('unsupported_step' in plan, false);
  if (!('unsupported_step' in plan)) {
    assert.equal(plan.actions[0].type, 'select_random_items');
    assert.equal(plan.actions[1].type, 'add_items');
    assert.equal(plan.actions[1].value_source.type, 'runtime');
  }
});

test('resolves sorting aliases deterministically', () => {
  const plan = buildAutomationPlan(tc([{ operation: 'select_option', value: 'price low to high', action: 'choose sorting', expected_result: 'listing updates' }]));
  assert.equal('unsupported_step' in plan, false);
  if (!('unsupported_step' in plan)) assert.deepEqual(plan.actions[0], { type: 'select', target: 'inventory.sort', value_source: { type: 'literal', value: 'lohi' } });
});

test('seeded random selection is reproducible and unique', () => {
  const first = chooseUnique(['a', 'b', 'c', 'd'], 3, createSeededRandom('42'));
  const second = chooseUnique(['a', 'b', 'c', 'd'], 3, createSeededRandom('42'));
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, 3);
});

test('unsupported semantic operations are classified by the planner', () => {
  const plan = buildAutomationPlan(tc([{ action: 'Perform an unsupported operation', expected_result: 'something observable' }]));
  assert.equal('unsupported_step' in plan, true);
});
