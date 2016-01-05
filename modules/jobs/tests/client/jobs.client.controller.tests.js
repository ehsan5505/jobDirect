'use strict';

(function () {
  // Jobs Controller Spec
  describe('Jobs Controller Tests', function () {
    // Initialize global variables
    var JobsController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Jobs,
      mockJob;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Jobs_) {
      // Set a new global scope
      scope = $rootScope.$new();

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Jobs = _Jobs_;

      // create mock job
      mockJob = new Jobs({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An Job about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Jobs controller.
      JobsController = $controller('JobsController', {
        $scope: scope
      });
    }));

    it('$scope.find() should create an array with at least one job object fetched from XHR', inject(function (Jobs) {
      // Create a sample jobs array that includes the new job
      var sampleJobs = [mockJob];

      // Set GET response
      $httpBackend.expectGET('api/jobs').respond(sampleJobs);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.jobs).toEqualData(sampleJobs);
    }));

    it('$scope.findOne() should create an array with one job object fetched from XHR using a jobId URL parameter', inject(function (Jobs) {
      // Set the URL parameter
      $stateParams.jobId = mockJob._id;

      // Set GET response
      $httpBackend.expectGET(/api\/jobs\/([0-9a-fA-F]{24})$/).respond(mockJob);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.job).toEqualData(mockJob);
    }));

    describe('$scope.create()', function () {
      var sampleJobPostData;

      beforeEach(function () {
        // Create a sample job object
        sampleJobPostData = new Jobs({
          title: 'An Job about MEAN',
          content: 'MEAN rocks!'
        });

        // Fixture mock form input values
        scope.title = 'An Job about MEAN';
        scope.content = 'MEAN rocks!';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Jobs) {
        // Set POST response
        $httpBackend.expectPOST('api/jobs', sampleJobPostData).respond(mockJob);

        // Run controller functionality
        scope.create(true);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // Test URL redirection after the job was created
        expect($location.path.calls.mostRecent().args[0]).toBe('jobs/' + mockJob._id);
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/jobs', sampleJobPostData).respond(400, {
          message: errorMessage
        });

        scope.create(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock job in scope
        scope.job = mockJob;
      });

      it('should update a valid job', inject(function (Jobs) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/jobs\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/jobs/' + mockJob._id);
      }));

      it('should set scope.error to error response message', inject(function (Jobs) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/jobs\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.remove(job)', function () {
      beforeEach(function () {
        // Create new jobs array and include the job
        scope.jobs = [mockJob, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/jobs\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.remove(mockJob);
      });

      it('should send a DELETE request with a valid jobId and remove the job from the scope', inject(function (Jobs) {
        expect(scope.jobs.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.job = mockJob;

        $httpBackend.expectDELETE(/api\/jobs\/([0-9a-fA-F]{24})$/).respond(204);

        scope.remove();
        $httpBackend.flush();
      });

      it('should redirect to jobs', function () {
        expect($location.path).toHaveBeenCalledWith('jobs');
      });
    });
  });
}());
