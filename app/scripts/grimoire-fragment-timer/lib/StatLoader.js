export default class StatLoader {
  constructor(api) {
    this.api = api;
  }

  endpoint(path) {
    return `${this.api.url}/${path}`;
  }

  fetch(data) {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint(`missions/${data.mission_id}/drops_stats`), {
          type: 'get',
          dataType: 'json',
          data: data.filter,
          crossDomain: true,
        })
        .then((response) => {
          resolve(response);
        })
        .fail(reject);
    });
  }
}
