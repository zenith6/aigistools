export default class Reporter {
  constructor(api, credentials) {
    this.api = api;
    this.credentials = credentials;
    this.account = null;
  }

  endpoint(path) {
    return `${this.api.url}/${path}`;
  }

  signup() {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint('account/signup'), {
          type: 'post',
          dataType: 'json',
          crossDomain: true,
        })
        .then((response) => {
          resolve(response.player);
        })
        .fail(reject);
    });
  }

  login(credentials) {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint('account/login'), {
          type: 'post',
          dataType: 'json',
          data: {
            name: credentials
          },
          crossDomain: true,
        })
        .then((response) => {
          resolve(response.player);
        })
        .fail(reject);
    });
  }

  record(data) {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint(`missions/${data.mission_id}/drops`), {
          type: 'post',
          dataType: 'json',
          data: data,
          headers: {
            'Authorization': `Bearer ${this.account.api_token}`,
          },
          crossDomain: true,
        })
        .then((response) => {
          resolve();
        })
        .fail(reject);
    });
  }

  deleteRecord() {
    return new Promise((resolve, reject) => {
      return $
        .ajax(this.endpoint(`missions/${data.mission_id}/drops`), {
          type: 'post',
          data: {
            '_method': 'delete',
          },
          headers: {
            'Authorization': `Bearer ${this.account.api_token}`,
          },
          crossDomain: true,
        })
        .then((response) => {
          resolve();
        })
        .fail(reject);
    });
  }

  loginOrSignup() {
    if (this.account) {
      return Promise.resolve(this.account);
    }

    if (this.credentials) {
      return this.login(this.credentials)
        .then((account) => {
          return account;
        })
        .catch(() => {
          this.credentials = null;
        });
    }

    return this.signup()
      .then((account) => {
        return account;
      });
  }

  send(data) {
    return this.loginOrSignup()
      .then((account) => {
        this.account = account;
        return this.record(data)
          .then(() => {
            return account;
          });
      });
  }

  clear(data) {
    return this.loginOrSignup()
      .then((account) => {
        this.account = account;
        return this.deleteRecord(data)
          .then(() => {
            return account;
          });
      });
  }
}
