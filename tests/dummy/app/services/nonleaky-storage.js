import Service from "@ember/service";

export default class NonleakyService extends Service.extend({
  init() {
    this._super(...arguments);
    this._data = Object.create(null);
  },

  set(key, value) {
    return (this._data[key] = value);
  },

  get(key) {
    return this._data[key];
  },

  remove(key) {
    delete this._data[key];
  },

  has(key) {
    return key in this._data;
  },
}) {}
