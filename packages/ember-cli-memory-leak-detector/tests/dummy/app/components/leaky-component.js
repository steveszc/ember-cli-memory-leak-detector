import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class LeakyComponent extends Component {
  @tracked totalClicks = 0;

  constructor() {
    super(...arguments);
    window.addEventListener('click', this.handleClick);
  }

  @action handleClick() {
    this.totalClicks++;
  }
}
