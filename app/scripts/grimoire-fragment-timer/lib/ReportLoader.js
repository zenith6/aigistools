export default class RecentReportLoader {
  constructor(api) {
    this.api = api;
  }

  endpoint(path) {
    return `${this.api.url}/${path}`;
  }

  fetch(data) {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint(`missions/${data.mission_id}/drops`), {
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
