'use strict';
const angular = require('angular');
import SignupController from './signup.controller';

export default angular.module('studentProgressTrackerApp.signup', [])
    .controller('SignupController', SignupController)
    .name;
