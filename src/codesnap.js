CodeSnap = function(O){

  this.config = {                // Defaults
    prefix    : O.prefix   || 'code-sampler-'
  , wrapper   : O.wrapper  || null
  , dir       : O.dir      || 'samples'
  , files     : O.files    || []
  , loaded    : O.loaded   || function(name, text){
                                console.log("CodeSnap> "+name+"loaded."); }
  , format: {
      title: associated(O, 'format.title')
               ? O.format.title
               : "<p>{{title}}</p>"
    , description: associated(O, 'format.description')
                     ? O.format.description
                     : "<div>{{description}}</div>"
    }
  }

  // Surrogaion
  var C = this.config;

  function associated(o, refstr){
    var s = (refstr || "").split(".")
      , k = s.shift() ;
    return (o.hasOwnProperty(k))
      ? associated(o[k], s.join("."))
      : (refstr ? false : true);
  }

  function prepare(f){
    var file = info(f);
    var wrp = C.wrapper ? document.getElementById(C.wrapper) : document.body;
    var el = document.getElementById(C.prefix + file.name);
    if(!el){
      el = document.createElement('div');
      el.setAttribute('id', C.prefix + file.name);
      wrp.appendChild(el);
    }
    var title = document.createElement('div');
      title.setAttribute('id', C.prefix + file.name + '-title');
      title.setAttribute('class', C.prefix + 'title');
      title.innerHTML = file.title;
    var description = document.createElement('div');
      description.setAttribute('id', C.prefix + file.name + '-description');
      description.setAttribute('class', C.prefix + 'description');
      description.innerHTML = file.description;
    var pre = document.createElement('pre');
      pre.setAttribute('id', C.prefix + file.name + '-code');
      pre.setAttribute('class', C.prefix + '-code');
    el.appendChild(title);
    el.appendChild(description);
    el.appendChild(pre);
  }

  // preview :: String -> String -> Nothing
  function preview(f, src){
    var file = info(f);
    var pre = document.getElementById(C.prefix + file.name + '-code');
    if(pre){
      pre.innerHTML = src;
    }
    try{
      (new Function("'use strict'; " + src))(file.params || {});
    }catch(e){
      console.warn("[CodeSnap] Error occured in " + file.name + ": \n"+e.stack);
    }
  }

  // load :: Object -> Closure -> XMLHttpRequest
  function load(param, c){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4 && xhr.status === 200){
        c(xhr.responseText);
      }
    }
    xhr.open('GET', param.url, true);
    xhr.send(null);
    return xhr;
  }

  // load_sorce :: String -> Closure -> XMLHttpRequest
  function load_sorce(url, done){
    return load({
      url: url
    }, done);
  }

  // make_source_url :: String -> String
  function make_source_url(f){
    return C.dir + '/' + info(f).name + '.js';
  }

  function is_a(v){
    return toString.call(v) === '[object Array]';
  }

  function info(v){
    return {
      name: is_a(v) ? v[0] : v,
      title: is_a(v)
        ? (v[1] && v[1].hasOwnProperty('title')?v[1].title:"") : "",
      description: is_a(v)
        ? (v[1] && v[1].hasOwnProperty('description')?v[1].description:"") : "",
      params: is_a(v)
        ? (v[1] && v[1].hasOwnProperty('params')?v[1].params:null) : null
    }
  }

  // fitering_file :: a -> Closure
  function fitering_file(file){
    var t = toString.call(file);
    return function(v, i){
      var fname = is_a(v) ? v[0] : v;
      switch (t) {
        case '[object Array]':
          return file.indexOf(fname) > -1;
        default:
          return fname === file;
      }
    }
  }


  this.load = function(file){
    var s = (file)
          ? C.files.filter(this.filtering_file(file))
          : C.files
          ;

    s.map(function(v, i){
      prepare(v);
      load_sorce(make_source_url(v), function(res){
        preview(v, res);
        C.loaded(v, res);
      });
    });
  }


  return this;
}

