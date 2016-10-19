# angular-multi-spa

Boilerplate for a modular multi spa (Single Page Application) in a single code base.
Inspired by https://johnpapa.net/angular-app-structuring-guidelines/.

## Features

* easy to add/remove Single Page Applications and modules
* component based
* SASS powered
* each SPA can have either have:
    * its own components (e.g.: components inside app/spa1)
    * shared ones (e.g.: the ones in app/module1), by adding external modules as dependency

## File structure

```
app/
  spa1.html
  spa2.html
  global.settings.scss
  global.scss

  module1/
      module1.module.js
      module1.module.test.js
      module1.scss
      
      module1comp1\
        module1comp1.html
        module1comp1.html
        module1comp1.component.js
        module1comp1.component.test.js

  spa1\
      spa1.scss
      spa1.controller.js
      spa1.controller.test.js
      spa1.module.js
      spa1.module.test.js

      spa1comp1\
        spa1comp1.html
        spa1comp1.scss
        spa1comp1.component.js

  spa2\
      spa2.scss
      spa2.controller.js
      spa2.controller.test.js
      spa2.module.js
      spa2.module.test.js

      spa2comp1\
        spa2comp1.html
        spa2comp1.scss
        spa2comp1.component.js
```

## Usage

1. `npm start -- --name=spa1`

1. open browser at `http://localhost:3000/dist/spa1/`

## Commands

```
npm install

npm lint

npm start -- --name=[name of the spa html file]

npm build -- --name=[name of the spa html file]

npm build-all

npm test

npm test.coverage
```

## How add another SPA

1. `cp -R app/spa1 app/fooApp`

1. `mv app/spa1/spa1.html app/fooApp/fooApp.html`

1. `mv app/fooApp/foApp.scss app/fooApp/foApp.scss` 

1. add components and controllers in `app/fooApp`

1. in `app/fooApp/fooApp.html`
    1. add/remove/update all the dependencies specific to your project
  
    1. add in `files: []` your new project files
  

