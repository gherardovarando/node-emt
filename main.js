const https = require("https");
const querystring = require('querystring');

const urls = {
  base: 'openbus.emtmadrid.es',
  api: '/emt-proxy-server/last',
  arrivestop: '/geo/GetArriveStop.php'
}
const defaultoptions = {

}

class Emt {
  constructor(options) {
    this._id = options.id;
    this._key = options.key;
    this._options = Object.assign(defaultoptions, options);
  }

  setIdentity(id, key) {
    this._id = id;
    this._key = key;
  }


  firstBus(idStop, lineId, cl) {
    let arrive = {
      busTimeLeft: 99999999
    };
    if (typeof lineId === 'number') {
      lineId = `${lineId}`;
    }
    this.arriveStop(idStop, (info) => {
      info.arrives.map((a) => {
        if (arrive.busTimeLeft > a.busTimeLeft && ((typeof lineId != 'string') || (lineId === a.lineId))) {
          arrive = a;
        }
      });
      if (typeof cl === 'function') {
        cl(arrive);
      }
    });
  }



  arriveStop(idStop, cl) {
    let body = {
      idStop: idStop
    }
    let path = urls.api + urls.arrivestop;
    this._request(path, body, cl);
  }

  _request(path, body, cl) {
    body = body || {};
    body = Object.assign({
      idClient: this._id,
      passKey: this._key
    }, body);
    let data = querystring.stringify(body);
    let req = https.request({
        hostname: urls.base,
        method: 'POST',
        path: path,
        port: 9443,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        const {
          statusCode
        } = res;
        const contentType = res.headers['content-type'];
        if (statusCode != 200) {
          console.log('error');
          return;
        }
        res.setEncoding('utf8');
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const info = JSON.parse(raw);
          if (typeof cl === 'function') {
            cl(info);
          }
        });
      }
    );
    req.write(data);
    req.end();
  }


}


module.exports = Emt;
