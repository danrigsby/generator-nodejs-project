const _ = require('lodash');
const chalk = require('chalk');
const del = require('del');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const Generator = require('yeoman-generator');
const yosay = require('yosay');

const yoFile = './yo.json';

module.exports = class extends Generator {
  prompting () {
    const done = this.async();
    this.context = {};

    // Greet the user
    const adjectives = ['spectacular', 'amazing', 'stupendous', 'super', 'remarkable', 'thrilling', 'wondrous', 'dazzling', 'sensational', 'historic', 'grand', 'striking', 'marvelous', 'rotund'];
    this.log(yosay(
      'Welcome to the ' + chalk.blue(adjectives[Math.floor(Math.random() * adjectives.length)]) + ' ' + chalk.red('node library') + ' generator!'
    ));

    let prompts = [];
    let yoData;

    // Check if we have an existing generation by checking for a valid "yo.json" file
    try {
      const data = fs.readFileSync(yoFile);
      yoData = JSON.parse(data);
      this.context.isExisting = true;
    } catch (e) {
      // ignore errors, we will just continue on with a new generation
    }

    // If we dont have yoData, then this is a generation
    if (!yoData) {
      prompts = [{
        type: 'input',
        name: 'displayName',
        default: _.capitalize(this.appname),
        message: 'Whats the display name of your project?',
        validate: function (input) {
          return !!input;
        }
      }, {
        type: 'input',
        name: 'name',
        default: _.kebabCase(this.appname),
        message: 'Whats the name of the repository for your project?',
        validate: function (input) {
          return !!input;
        }
      }, {
        type: 'input',
        name: 'description',
        message: 'Whats a short description of this project?',
        validate: function (input) {
          return !!input;
        }
      }, {
        type: 'input',
        name: 'org',
        default: 'danrigsby',
        message: 'Whats the github organization for the project?',
        validate: function (input) {
          return !!input;
        }
      }, {
        type: 'input',
        name: 'author',
        default: 'Dan Rigsby <danrigsby@gmail.com>',
        message: 'Who is the author of the project?',
        validate: function (input) {
          return !!input;
        }
      }];
    } else {
      prompts = [{
        type: 'confirm',
        name: 'shouldUpdate',
        default: 'n',
        message: 'Existing generation found.\nOnly base files will be modified.\nWould you like to update them? (You can manually merge back changes)',
        validate: function (input) {
          return !!input;
        }
      }];
    }

    return this.prompt(prompts).then((props) => {
      if (yoData) {
        // Grab all data from yo.json and assign them as template variables
        Object.assign(this.context, {
        }, yoData);
      } else {
        this.context.author = props.author;
        this.context.description = props.description;
        this.context.displayName = props.displayName;
        this.context.name = props.name;
        this.context.org = props.org;
      }
      this.context.timestamp = new Date().toISOString();
      this.context.shouldUpdate = props.shouldUpdate;

      // Check if we should continue
      if (this.context.isExisting && !this.context.shouldUpdate) {
        console.log('Aborting update...');
        process.exit(1);
      }

      done();
    });
  }

  _copy(file, destination) {
    const fn = (f, d) => {
      this.fs.copy(
        this.templatePath(f),
        this.destinationPath(d || f.replace(/^_/, '.'))
      );
    };
    if (Array.isArray(file)) {
      file.forEach((f) => fn(f));
    } else {
      fn(file, destination);
    }
  }

  _template(file, destination, context = this.context) {
    const fn = (f, d, c) => {
      this.fs.copyTpl(
        this.templatePath(f),
        this.destinationPath(d || f),
        context
      );
    };
    if (Array.isArray(file)) {
      file.forEach((f) => fn(f));
    } else {
      fn(file, destination);
    }
  }

  writing() {
      if (this.context.isExisting) {
        // Delete the existing yo.json file as it will be recreated
        del(yoFile);
      }

      this._copy([
        '_babelrc',
        '_editorconfig',
        '_eslintignore',
        '_eslintrc',
        '_flowconfig',
        '_gitattributes',
        '_gitignore'
      ]);

      this._template([
        'README.md',
        'circle.yml',
        'package.json',
        'yo.json'
      ]);

      // If this is an existing folder, do no update base folders
      if (!this.context.isExisting) {
        mkdirp('src');
      }
  }

  end() {
    if (this.context.isExisting) {
      this.log('Only base files have been modified. You can manually merge back changes to those files.');
      this.log('');
    }
    this.log('Type "npm start" in the root of this directory to run this application.');
  }

  install() {
    this.installDependencies({
      npm: true,
      bower: false,
      skipInstall: this.options['skip-install']
    });
  }
}
