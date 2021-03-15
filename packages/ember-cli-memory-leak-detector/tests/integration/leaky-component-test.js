import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | leaky component', function(hooks) {
  setupRenderingTest(hooks);

  test('tracks window clicks', async function(assert) {
    await render(hbs`<LeakyComponent />`);

    assert.dom('#clicks').hasText('0');

    await click('button');

    assert.dom('#clicks').hasText('1');
  });
});
