'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Job Schema
 */
var JobSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  company: {
    type: String,
    default: '',
    trim: true,
    required: 'Company Name must be given'
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  descriptions: {
    type: String,
    default: '',
    trim: true
  },
  requirements: {
    type: String,
    default:''
  },
  pay: {
    type: Number,
    default: 0
  },
  state: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Job', JobSchema);
