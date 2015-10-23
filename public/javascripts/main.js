(function(global) {
  var toParam = function(obj) {
    return Object.keys(obj).map(function(k) {
      return k + '=' + obj[k]
    }).join('&')
  };

  var dom = {
    $: document.querySelector.bind(document),

    fetch: function (url, options) {
      options.method = options.method || 'GET';
      if(!options.contentType)
        options.data = (options.data ===  Object(options.data)) ? toParam(options.data) : options.data;

      return new Promise(function(res, rej){
        var xhr = new XMLHttpRequest;
        xhr.open(options.method, url, true);
        if(options.contentType != 'multipart')
        xhr.setRequestHeader("Content-type", options.contentType || "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
          if(xhr.status < 400 && xhr.readyState === 4)
          res(xhr.responseText, xhr)
        };
        xhr.onerror = function (err) {
          console.log(err)
          rej(err);
        };
        xhr.send(options.data)
      });
    }
  }

  return Object.assign(global, dom)
})(window)


var Router = {
  routes: [],
  mode: null,
  root: '/',

  config: function config (options) {
    if(options && options.mode && !!history.pushState)
      this.mode = 'history';
    else
      this.mode = 'hash';
    this.root = options && options.root ? '/' + this.clearSlashes(options.root) + '/' : this.root;
    
    return this;
  },

  clearSlashes: function clearSlashes (path) {
    return path.toString().replace(/\/$/, '').replace(/^\//, '');
  },

  getFragment: function getFragment () {
    var fragment = '';
    if(this.mode == 'history') {
      fragment = decodeURI(location.pathname);
      fragment = this.root != '/' ? fragment.replace(this.root, '') : fragment;
    } else {
      fragment = !!location.hash ? location.hash.slice(1) : fragment;
    }
    return '/' + this.clearSlashes(fragment);
  },

  check: function check (f) {
    f = f || this.getFragment();
    for(var i = 0; i < this.routes.length; i++) {
      if(this.routes[i] && this.routes[i].re == f) {
        this.routes[i].handler.apply({}, [this.routes[i].re]);
        return this;
      }
    }
    return this;
  },

  add: function add (re, handler) {
    if(re && re.call) {
      handler = re;
      re = '';
    }
    this.routes.push({ re: re, handler: handler });
    return this;
  },

  remove: function remove (param) {
    for(var i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
      if(param.toString() == r.handler.toString() || param.toString() == r.re.toString()) {
        this.routes.splice(i, 1);
        return this;
      }
    }
    return this;
  },

  listen: function listen () {
    var that = this;
    var current = that.getFragment();
    
    var fn = function() {
      current = that.getFragment();
      that.check(current);
    };

    window.addEventListener('hashchange', fn);
    return this;
  }
};

function tmpl(url, data) {
  var re = /<%([^%>]+)?%>/g;
  return fetch(url, { method: 'GET' })
    .then(function (resp) {
      resp = resp.replace(/[\n\r\t]/g, '');

      if(data) {
        var cursor = 0, code = 'var r = [];\n', match;
        var rexJS = /^\s+?(if|for|else|switch|case|break|{|})/g
        var add = function (line, js) {
          if(js)
            code += rexJS.test(line) ? line +'\n' : 'r.push(' + line + ');'
          else
            code += 'r.push("'+ line.replace(/"/g, '\\"') +'");\n';
        };

        while(match = re.exec(resp)) {
          add(resp.slice(cursor, match.index));
          add(match[1], true);
          cursor = match.index + match[0].length;
        }
        add(resp.substr(cursor, resp.length - cursor));
        code += 'return r.join("")';
        resp = new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
      }
      console.log(resp)
      
      return resp;
    });
}

tmpl.render = function (parent, html, append) {
  if(!append) {
    (parent || document.body).innerHTML = '';
  }
  (parent || document.body).innerHTML += html;
};


var Navbar = Object.create(HTMLElement.prototype);

function renderNavbarShadowDom(dList) {
  var that = this;
  this.templateStyle = ['<style>',
               ' .list-inline li {',
                    'display: inline-block;',
                    'padding: 5px 7px;',
                  '}',
                  'a {',
                    'color: #00B7FF',
                  '}',
              '</style>'].join('');

  this.list = '';

  dList.forEach(function (el) {
    that.list += '<li><a href="#' + el + '">' + el +'</a></li>';
  });
}

Navbar.createdCallback =  function() {
  renderNavbarShadowDom.call(this, JSON.parse(this.dataset.list));
  this.shadow = this.createShadowRoot();
  this.shadow.innerHTML = this.templateStyle + '<ul class=list-inline>' + this.list + '</ul>';
};

Navbar.attributeChangedCallback = function(_, _old, newList) {
  renderNavbarShadowDom.call(this, JSON.parse(newList));
  this.shadow.innerHTML = this.templateStyle + '<ul class=list-inline>' + this.list + '</ul>';
};

document.registerElement('nav-bar', { prototype: Navbar })

document.addEventListener('DOMContentLoaded', function() {
  Router.check();
});

Router.config()
  .add('/', function() {
    tmpl('/templates/welcome.html')
      .then(function(html) { tmpl.render($("main"), html); })
  })
  .add('/signup', function() {
    if(localStorage.getItem('user'))
      return;
    tmpl('/templates/signup.html')
      .then(function(html) {
        tmpl.render($("main"), html);
        $('#userForm').onsubmit = function(e) {
          e.preventDefault()
          var fN = $("#firstName").value,
          lN = $("#lastName").value,
          em = $("#email").value,
          pS = $("#password").value;

          fetch('/users/create', {
            method: 'POST',
            data: { firstName: fN, lastName: lN, email: em, password: pS }
          }).then(function(data) {
            localStorage.setItem("user", data);
            $('nav-bar').dataset.list = $('nav-bar').dataset.list.push('logout');
          })
        }
      })
  })
  .add('/login', function() {
    if(localStorage.getItem('user'))
      return;
    tmpl('/templates/login.html')
      .then(function(html) {
         tmpl.render($("main"), html);
         $("#loginForm").onsubmit = function (e) {
          e.preventDefault();
          var em = $("#loginEmail").value,
          pS = $("#loginPassword").value;

          fetch('/users/login', {
            method: 'POST',
            data: { email: em, password: pS }
          }).then(function (data) {
            localStorage.setItem('user', data);
            var list = JSON.parse($('nav-bar').dataset.list);
            list.push('logout');
            list.splice(list.indexOf('signup'), 1);
            list.splice(list.indexOf('login'), 1);
            $('nav-bar').dataset.list = JSON.stringify(list);
            Router.check('/users')
          })
        }
      })
  })
  .add('/users', function() {
    fetch('/users', {}).then(function(data) {
      var data = JSON.parse(data);
      tmpl('/templates/users.html', data.users)
        .then(function(html) { 
          tmpl.render($("main"), html);
        });
    });
  })
  .add('/upload', function() {

  })
  .add('/logout', function() {
    localStorage.removeItem('user');
    var list = JSON.parse($('nav-bar').dataset.list);

    if(list.indexOf('logout') >= 0)
      list.splice(list.indexOf('logout'), 1);
    if(list.indexOf('login') < 0)
      list.unshift('login');
    if(list.indexOf('signup') < 0)
      list.unshift('signup');
    $('nav-bar').dataset.list = JSON.stringify(list);
  })
  .listen()

//   $("#uploadForm").onsubmit = function(e) {
//     e.preventDefault();
//     var user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) :  undefined;

//     var fD = new FormData();
//     var files = $("#files").files;
//     [].forEach.call(files, function(f) {
//       fD.append('files[]', f)
//     });

//     if(user) {
//       fetch('/users/' + user.id + '/upload', {
//         method: 'PATCH',
//         contentType: 'multipart',
//         data: fD
//       })
//     }
//   }
