const net = require('net');
const events = require('events');

let socket = new net.Socket();
let observer_id = 0,
  command_id = 0;

// Register EventEmitter
class MpvEvent extends events {
  init() {
    socket.connect({
      path: '\\\\.\\pipe\\mpvsocket'
    });
    return this;
  }
  set_property(name, args) {
    return this.send_command('set_property', [name, ...args]);
  }
  get_property(name) {
    return this.send_command('get_property', [name]);
  }
  observe_property(prop_name) {
    return this.send_command('observe_property', [++observer_id, prop_name]);
  }
  /**
   * Send command with args
   * @param {String} name command name
   * @param {Array} args arg array
   */
  send_command(name, args) {
    return new Promise((resolve, reject) => {
      let ipc_data = {
        command: args ? [name, ...args] : [name],
        request_id: ++command_id
      };
      console.log('write cmd:');
      console.log(ipc_data);

      function bindRes(res_data) {
        if (res_data.request_id === ipc_data.request_id) {
          // res for this set property
          this.removeListener('resProperty', bindRes);
          console.log('recived:');
          console.log(res_data);

          if (res_data.error === 'success') resolve(res_data.data);
          else reject(res_data);
        }
      }

      this.on('resProperty', bindRes);
      socket.write(`${JSON.stringify(ipc_data)}\n`);
    });
  }

  quit() {
    this.send_command('quit');

    socket.removeAllListeners('close');
    socket.removeAllListeners('error');
    socket.removeAllListeners('data');
    socket.destroy();
  }
};

let my_emitter = new MpvEvent();
module.exports = my_emitter;

socket.on('error', (err) => {
  console.log(err);
});

socket.on('close', (err) => {
  console.log('Socket closed, try to reconnect..');
  socket.end();

  socket.connect({
    path: '\\\\.\\pipe\\mpvsocket'
  });
});

socket.on('data', (data) => {
  datas = data.toString().split('\n'); // multi response can be merged

  datas.forEach(res => {
    if (res.length <= 0) return; // empty string may exist
    res = JSON.parse(res);
    // console.log(res);

    if (res.request_id) {
      // res for command
      my_emitter.emit('resProperty', res);
    } else if (res.event) {
      if (res.event === 'property-change')
        // event for observe property
        my_emitter.emit(`${res.name}-change`, res.data);
      else {
        // trival events
        console.log(res);
        my_emitter.emit(res.event, res.data);
      }
    }
  });
})
