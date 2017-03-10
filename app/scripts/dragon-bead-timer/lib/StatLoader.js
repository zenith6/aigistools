export default class StatLoader {
  constructor(api) {
    this.api = api;
  }

  endpoint(path) {
    return `${this.api.url}/${path}`;
  }

  fetch() {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint('stat/drops'), {
          type: 'get',
          dataType: 'json',
          crossDomain: true,
        })
        .then((response) => {
          resolve(response);
        })
        .fail(reject);
    });
  }
}
