var util = require('util'),
    async = require('async'),
    irc = require('irc'),
    winston = require('winston');

var CHANCHARS = '#&!';

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
  this.selfSigned = option.selfSigned || false;
  this.details = options.details || false;
  this.level = options.level || 'info';

  if (Array.isArray(options.channels)) {
    this.channels = {};
    options.channels.forEach(function (channel) {
      self.channels[channel] = true;
    });
  }
  else {
    this.channels = options.channels;
  }

  if (!this.port) {
    this.port = this.ssl ? 6697 : 6667;
  }

  // initialise IRC client
  this._client = new irc.Client(this.host, this.nick, {
    channels: Object.keys(this.channels).filter(function(channel) { return CHANCHARS.indexOf(channel[0]) != -1; }),
    port: this.port,
    secure: this.ssl,
    nick: this.nick,
    password: this.pass,
    userName: 'winston',
    realName: 'winston IRC logger',
    selfSigned: this.selfSigned
  });

  // keep connected state on the transport object
  this._client.on('registered', function() {
    this.connected = true;
  }.bind(this));
  this._client.conn.on('close', function() {
    this.connected = false;
  }.bind(this));

  // pass errors on
  this._client.conn.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  // set up queues for handling messages only when the channel is joined
  this.queues = {};
  Object.keys(this.channels).forEach(function(channel) {
    var isNick = CHANCHARS.indexOf(channel[0]) == -1;
    self.queues[channel] = async.queue(function trylog(text, callback) {
      if (!self.connected) return self._client.once('registered', trylog.bind(null, text, callback));
      if (!isNick && !(channel in self._client.chans)) return self._client.once('join', trylog.bind(null, text, callback));
      self._client.say(channel, text);
      return callback();
    }, 1);

    self.queues[channel].drain = function() {
      self._ref();
    };

    var push = self.queues[channel].push;
    self.queues[channel].push = function(data, cb){
      var ret = push.apply(this, arguments);
      self._ref();
      return ret;
    };
  });
}

Irc.prototype._ref = function() {
  var self = this;
  var empty = Object.keys(this.queues).every(function(key) { return self.queues[key].length() === 0; });
  if (!this._client || !this._client.conn || !this._client.conn.unref || !this._client.conn.ref) return;
  if (empty) this._client.conn.unref();
  else this._client.conn.ref();
};

Irc.prototype.log = function(level, msg, meta, callback) {
  var self = this;
  var text = this.format({
    level: level,
    msg: msg,
    meta: meta
  });

  async.forEach(Object.keys(this.channels), function(channel, callback) {
    //XXX: this really should be message.level >= channel.level, not message.level == channel.level. winston doesn't seem to expose log levels, however.
    if (self.channels[channel] != level && self.channels[channel] !== true && (!Array.isArray(self.channels[channel]) || self.channels[channel].indexOf(level) == -1)) return;
    self.queues[channel].push(text, callback);
  }, callback);
};

Irc.prototype.format = function(data) {
  //TODO: colorize
  if (this.details)
    return data.level + ': ' + data.msg + '[' + JSON.stringify(data.meta) + ']' ;
  else
    return data.level + ': ' + data.msg ;
};
