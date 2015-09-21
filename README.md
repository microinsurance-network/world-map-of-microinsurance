## World Map of Microinsurance

This repository hosts the website for the [World Map of Microinsurance]().

### Development Process

Follow theses steps to serve the site locally

    npm install
    bower install
    grunt serve

Build the site with

    grunt build

The built files can be pushed to the `gh-pages` branch with

    git subtree push --prefix dist origin gh-pages

In practice, the `dist` folder should instead be pushed to a new branch and
merged to `gh-pages` via PR to preserve any manual changes made there.
