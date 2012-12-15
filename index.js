var util = require('util'),
    async = require('async'),
    irc = require('irc'),
    winston = require('winston');

var exports = module.exports = Irc;
exports.Irc = Irc;

util.inherits(Irc, winston.Transport);
function Irc(options) {
  options = options || {};
  var self = this;

  this.name = 'irc';
  this.ssl = !!options.ssl;
  this.host = options.host || 'localhost';
  this.port = options.port;
  this.nick = options.nick;
  this.pass = options.pass;
  this.level = options.level || 'info';

  if (Array.isArray(options.channels)) {
    this.channels = {};
    options.channels.forEach(function (channel) {
      self.channels[channel] = self.level;
    });
  }
  else {
    this.channels = options.channels;
  }

  if (!this.port) {
    this.port = this.ssl ? 6667 : 6667;
  }

  // initialise IRC client
  this._client = new irc.Client(this.host, this.nick, {
    channels: Object.keys(this.channels),
    port: this.port,
    secure: this.ssl,
    nick: this.nick,
    password: this.pass,
    userName: 'winston',
    realName: 'winston IRC logger'
  });

  // keep connected state on the transport object
  this._client.on('registered', function() {
    this.connected = true;
  }.bind(this));
  this._client.conn.on('close', function() {
    this.connected = false;
  }.bind(this));

  // set up queues for handling messages only when the channel is joined
  this.queues = {};
  Object.keys(this.channels).forEach(function(channel) {
    self.queues[channel] = async.queue(function trylog(text, callback) {
      if (!self.connected) return self._client.on('registered', trylog.bind(null, text, callback));
      if (!(channel in self._client.chans)) return self._client.on('join', trylog.bind(null, text, callback));
      self._client.say(channel, text);
      return callback();
    }, 1);
  });
}

Irc.prototype.log = function(level, msg, meta, callback) {
  var self = this;
  var text = this.format({
    level: level,
    msg: msg,
    meta: meta
  });
  async.forEach(Object.keys(this.channels), function(channel, callback) {
    //TODO: actually respect the per-channel logging levels
    self.queues[channel].push(text, callback);
  }, callback);
};

Irc.prototype.format = function(data) {
  //TODO: colorize
  return data.level + ': ' + data.msg;
};
