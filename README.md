winston-irc
===========
winston-irc is an IRC transport for [Winston], the awesome node.js logging library.

new Irc(options)
----------------
returns a new transport instance
options is an object with the following properties
 * host: the IRC server
 * port: the IRC port (defaults to 6667 for plaintext, 6697 for SSL)
 * ssl: whether the IRC connection should be over SSL
 * nick: the IRC nick
 * pass: the IRC password, passed using PASS. you can use this for NickServ on a bunch of networks.
 * level: the logging level, used by Winston.
 * channels: either an array of 'channels' to log to (nicknames are allowed too) or an object, with the channel names as keys and with arrays with levels to be logged there as value. true means all levels.

an example
----------

```javascript
winston.add(require('winston-irc'), {
  host: 'irc.somewhere.net',
  nick: 'logger',
  pass: 'hunter2',
  channels: {
    '#logs': true,
    'sysadmin': ['warn', 'error']
  }
});
```

or use it in your [Flatiron] app:

```javascript
app.log.get('default').add(require('winston-irc'),{
  host: 'irc.somewhere.net',
  nick: 'logger',
  pass: 'hunter2',
  channels: {
    '#logs': true,
    'sysadmin': ['warn', 'error']
  }
});
```

[Winston]: https://github.com/flatiron/winston
[Flatiron]: http://flatironjs.org/
