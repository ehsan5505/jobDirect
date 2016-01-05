'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Job = mongoose.model('Job'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, job;

/**
 * Job routes tests
 */
describe('Job CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new job
    user.save(function () {
      job = {
        title: 'Job Title',
        content: 'Job Content'
      };

      done();
    });
  });

  it('should be able to save an job if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new job
        agent.post('/api/jobs')
          .send(job)
          .expect(200)
          .end(function (jobSaveErr, jobSaveRes) {
            // Handle job save error
            if (jobSaveErr) {
              return done(jobSaveErr);
            }

            // Get a list of jobs
            agent.get('/api/jobs')
              .end(function (jobsGetErr, jobsGetRes) {
                // Handle job save error
                if (jobsGetErr) {
                  return done(jobsGetErr);
                }

                // Get jobs list
                var jobs = jobsGetRes.body;

                // Set assertions
                (jobs[0].user._id).should.equal(userId);
                (jobs[0].title).should.match('Job Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an job if not logged in', function (done) {
    agent.post('/api/jobs')
      .send(job)
      .expect(403)
      .end(function (jobSaveErr, jobSaveRes) {
        // Call the assertion callback
        done(jobSaveErr);
      });
  });

  it('should not be able to save an job if no title is provided', function (done) {
    // Invalidate title field
    job.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new job
        agent.post('/api/jobs')
          .send(job)
          .expect(400)
          .end(function (jobSaveErr, jobSaveRes) {
            // Set message assertion
            (jobSaveRes.body.message).should.match('Title cannot be blank');

            // Handle job save error
            done(jobSaveErr);
          });
      });
  });

  it('should be able to update an job if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new job
        agent.post('/api/jobs')
          .send(job)
          .expect(200)
          .end(function (jobSaveErr, jobSaveRes) {
            // Handle job save error
            if (jobSaveErr) {
              return done(jobSaveErr);
            }

            // Update job title
            job.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing job
            agent.put('/api/jobs/' + jobSaveRes.body._id)
              .send(job)
              .expect(200)
              .end(function (jobUpdateErr, jobUpdateRes) {
                // Handle job update error
                if (jobUpdateErr) {
                  return done(jobUpdateErr);
                }

                // Set assertions
                (jobUpdateRes.body._id).should.equal(jobSaveRes.body._id);
                (jobUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of jobs if not signed in', function (done) {
    // Create new job model instance
    var jobObj = new Job(job);

    // Save the job
    jobObj.save(function () {
      // Request jobs
      request(app).get('/api/jobs')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single job if not signed in', function (done) {
    // Create new job model instance
    var jobObj = new Job(job);

    // Save the job
    jobObj.save(function () {
      request(app).get('/api/jobs/' + jobObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', job.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single job with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/jobs/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Job is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single job which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent job
    request(app).get('/api/jobs/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No job with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an job if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new job
        agent.post('/api/jobs')
          .send(job)
          .expect(200)
          .end(function (jobSaveErr, jobSaveRes) {
            // Handle job save error
            if (jobSaveErr) {
              return done(jobSaveErr);
            }

            // Delete an existing job
            agent.delete('/api/jobs/' + jobSaveRes.body._id)
              .send(job)
              .expect(200)
              .end(function (jobDeleteErr, jobDeleteRes) {
                // Handle job error error
                if (jobDeleteErr) {
                  return done(jobDeleteErr);
                }

                // Set assertions
                (jobDeleteRes.body._id).should.equal(jobSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an job if not signed in', function (done) {
    // Set job user
    job.user = user;

    // Create new job model instance
    var jobObj = new Job(job);

    // Save the job
    jobObj.save(function () {
      // Try deleting job
      request(app).delete('/api/jobs/' + jobObj._id)
        .expect(403)
        .end(function (jobDeleteErr, jobDeleteRes) {
          // Set message assertion
          (jobDeleteRes.body.message).should.match('User is not authorized');

          // Handle job error error
          done(jobDeleteErr);
        });

    });
  });

  it('should be able to get a single job that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new job
          agent.post('/api/jobs')
            .send(job)
            .expect(200)
            .end(function (jobSaveErr, jobSaveRes) {
              // Handle job save error
              if (jobSaveErr) {
                return done(jobSaveErr);
              }

              // Set assertions on new job
              (jobSaveRes.body.title).should.equal(job.title);
              should.exist(jobSaveRes.body.user);
              should.equal(jobSaveRes.body.user._id, orphanId);

              // force the job to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the job
                    agent.get('/api/jobs/' + jobSaveRes.body._id)
                      .expect(200)
                      .end(function (jobInfoErr, jobInfoRes) {
                        // Handle job error
                        if (jobInfoErr) {
                          return done(jobInfoErr);
                        }

                        // Set assertions
                        (jobInfoRes.body._id).should.equal(jobSaveRes.body._id);
                        (jobInfoRes.body.title).should.equal(job.title);
                        should.equal(jobInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Job.remove().exec(done);
    });
  });
});
