#!/usr/bin/env node

'use strict';

// ===================
// Module dependencies
// ===================

/**
 * External
 */

const fs = require("fs");
const cheerio = require("cheerio");
const path = require('path');
const ProgressBar = require('ascii-progress');

/**
 * External
 */

const log = require('../helpers/log-helper');
const shell = require('../helpers/shell-helper');
const walk = require('../helpers/walk-helper');

// ==============
// Tasks
// ==============

const unitTest = function() {
  test('unitTest');
}

const functionalTest = function() {
  test('functionalTest');
}

const sanityTest = function() {
  test('sanityTest');
}

const integrationTest = function() {
  test('integrationTest');
}

const test = function(type) {
  log.title(type + "...");

  walk.bundleProjects().forEach(function(project) {
    log.info(project.path);

    shell.run(`cd ${project.path} && gradle deploy install ${type}`, null, { sync: true });
  });
}

const coverage = function() {

  let projects = walk.bundleProjects();

  projects.forEach(function(project) {

    let reportFile = `./${project.path}/build/reports/jacoco/test/html/index.html`;

    shell.run(`cd ${project.path} && gradle deploy install test jacocoTestReport`, null, { sync: true });

    let content;
    let value;

    try {
      content = fs.readFileSync(reportFile);
    } catch (err) {
      console.log('Not found: ', reportFile);
    }

    if (content) {
      let $ = cheerio.load(content);

      value = $('tfoot tr .ctr2').slice(0).eq(0).text().replace('%', '');

    }

    project.coverage = ((content && value) ? value : 0);
    project.coverageReport = reportFile;

  });

  projects.forEach(function(project) {
    var cyan = '\u001b[46m \u001b[0m';
    var red = '\u001b[41m \u001b[0m';

    var bar = new ProgressBar({
      schema: '|:bar.gradient(red,cyan)| :current% => :title [:report] ',
      width: 20,
      total: 101
    });
    bar.tick(project.coverage, { title: project.name, report: project.coverageReport });
  })


}

// ==============
// Export
// ==============

module.exports = {
  unitTest,
  functionalTest,
  sanityTest,
  integrationTest,
  coverage
}
