winston-irc
===========
winston-irc is an IRC transport for [Winston], the awesome node.js logging library.

new Irc(options)
----------------
returns a new transport instance. you probably won't ever use this constructor directly, it's more convenient to use it through Winston as in the example.

options is an object with the following properties
 * host: the IRC server
 * port: the IRC port (defaults to 6667 for plaintext, 6697 for SSL)
 * ssl: whether the IRC connection should be over SSL
 * nick: the IRC nick
 * pass: the IRC password, passed using PASS. you can use this for NickServ on a bunch of networks.
 * level: the logging level, used by Winston.
 * channels: either an array of 'channels' to log to (nicknames are allowed too) or an object, with the channel names as keys and with arrays with levels to be logged there as value. true means all levels.

a note of caution
-----------------
as of node 0.8.16, sockets don't support ref/unref yet. this means winston-irc will keep your app from terminating because node sees there's still something active.
when available winston-irc uses ref/unref (supported from node 0.9.1 on) so that your application will smoothly terminate as usual when everything's been done and logged.

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
