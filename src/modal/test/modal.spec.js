describe('$modal', function () {
  var $rootScope, $document, $compile, $templateCache, $timeout, $q, $window, $provide;
  var $modal, $modalProvider;
  var mockWindow, mockComputedStyle;

  var triggerKeyDown = function (element, keyCode) {
    var evt = {type: 'keydown', which: keyCode};
    element.triggerHandler(evt);
  };

  var waitForBackdropAnimation = function () {
    inject(function ($transition) {
      if ($transition.transitionEndEventName) {
        $timeout.flush();
      }
    });
  };

  beforeEach(module('mm.foundation.modal'));
  beforeEach(module('template/modal/backdrop.html'));
  beforeEach(module('template/modal/window.html'));
  beforeEach(module(function(_$controllerProvider_, _$modalProvider_, $provide){
    $controllerProvider = _$controllerProvider_;
    $modalProvider = _$modalProvider_;

    var mockdocument = angular.element(document);
    $provide.value('$document', mockdocument);

    mockComputedStyle = {
      top: 0
    };

    mockWindow = {
      location: "val",
      document: mockdocument,
      pageYOffset: 4,
      this_is_a_mock_window: true,
      getComputedStyle: jasmine.createSpy("$window.getComputedStyle").and.returnValue(mockComputedStyle)
    };
    $provide.value('$window', mockWindow);

  }));

  beforeEach(inject(function (_$rootScope_, _$document_, _$compile_, _$templateCache_, _$timeout_, _$q_, _$modal_, _$window_) {
    $rootScope = _$rootScope_;
    $document = _$document_;
    $compile = _$compile_;
    $templateCache = _$templateCache_;
    $timeout = _$timeout_;
    $q = _$q_;
    $modal = _$modal_;
    $window = _$window_;
  }));

  beforeEach(inject(function ($rootScope) {
    jasmine.addMatchers({
      toBeResolvedWith: function(util, customEqualityTesters) {

        function compare(actual, expected){

          var resolved;
          actual.then(function(result){
            resolved = result;
          });
          $rootScope.$digest();

          var passed = resolved === expected;
          return {
            pass: passed,
            message: "Expected '" + angular.mock.dump(actual) + "' to be resolved with '" + expected + "'."
          };
        }

        return {compare: compare};
      },
      toBeRejectedWith: function(util, customEqualityTesters) {

        function compare(actual, expected){
          var rejected;
          actual.then(angular.noop, function(reason){
            rejected = reason;
          });
          $rootScope.$digest();

          var passed = rejected === expected;
          return {
            pass: passed,
            message: "Expected '" + angular.mock.dump(actual) + "' to be rejected with '" + expected + "'."
          };
        }

        return {compare: compare};
      },

    /**
     * If you have  <div class="reveal ..." style="... ; mystyle: fred ...">
     *
     *  call toHaveModalOpenWithStyle('mystyle', 'fred')
     *
     *  @param style style name to find in target div
     *  @param value style value to test in target div
     *  @return true when style="mystyle" value is correct.
     *
     */

      toHaveModalOpenWithStyle: function(util, customEqualityTesters) {

        function compare(actual, style, expected){
          var modalDomEls = actual[0].querySelector('body > div.reveal');
          var passed = getComputedStyle(modalDomEls)[style] === expected;
          return {
            pass: passed,
            message: "Expected '" + angular.mock.dump(modalDomEls) + "' to have a style " + style + " with value " + expected + "."
          };
        }

        return {compare: compare};
      },

      toHaveModalOpenWithContent: function(util, customEqualityTesters) {

        function compare(actual, content, selector){
          var modalDomEls = actual[0].querySelector('body > div.reveal > div');
          var contentToCompare = selector ? modalDomEls.querySelector(selector) : modalDomEls;
          var passed = getComputedStyle(modalDomEls)['display'] === 'block' &&  contentToCompare.innerHTML == content;
          return {
            pass: passed,
            message: "Expected '" + angular.mock.dump(modalDomEls) + "' to be open with '" + content + "'."
          };
        }

        return {compare: compare};
      },

      toHaveModalsOpen: function(util, customEqualityTesters) {

        function compare(actual, noOfModals){
          var modalDomEls = actual[0].querySelectorAll('body > div.reveal');
          var passed = modalDomEls.length === noOfModals;
          return {
            pass: passed
          };
        }

        return {compare: compare};
      },

      toHaveBackdrop: function(util, customEqualityTesters) {

        function compare(actual){
          var backdropDomEls = actual[0].querySelectorAll('body > div.reveal-overlay');

          var passed = backdropDomEls.length === 1;
          return {
            pass: passed,
            message: "Expected '" + angular.mock.dump(backdropDomEls) + "' to be a backdrop element'."
          };
        }

        return {compare: compare};
      },

      toHaveModalOpenInOtherParent: function(util, customEqualityTesters) {

        function compare(actual, parentSelector){
          var modalElem = actual[0].querySelectorAll(parentSelector + ' > .reveal');
          var passed = modalElem.length === 1;
          return {
            pass: passed,
            message: 'Expected modal to be a parent of: ' + parentSelector
          };
        }

        return {compare: compare};
      },
    });
  }));

  afterEach(function () {
    var body = $document[0].querySelector('body');

    var modals = angular.element(body.querySelectorAll('div.reveal'));
    var bgs = angular.element(body.querySelectorAll('div.reveal-overlay'));

    modals.remove();
    bgs.remove();

    if (body.classList) {
      body.classList.remove('is-reveal-open');
    }
    else {
      body.className = body.className.replace(new RegExp('(^|\\b)' + 'is-reveal-open'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

  });

  function open(modalOptions) {
    var modal = $modal.open(modalOptions);
    $rootScope.$digest();
    return modal;
  }

  function close(modal, result) {
    modal.close(result);
    $rootScope.$digest();
  }

  function dismiss(modal, reason) {
    modal.dismiss(reason);
    $timeout.flush();
    $rootScope.$digest();
  }

  describe('modal invoked with y offsets', function () {
    it('should create the modal at the correct location based on window y position', function () {
      $window.pageYOffset = 400;

      var modal = open({template: '<div>Content</div>'});
      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithStyle('top', '400px');
    });
  });

  describe('basic scenarios with default options', function () {

    it('should open and dismiss a modal with a minimal set of options', function () {

      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).toHaveBackdrop();

      dismiss(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      waitForBackdropAnimation();
      expect($document).not.toHaveBackdrop();
    });

    it('should not throw an exception on a second dismiss', function () {
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).toHaveBackdrop();

      dismiss(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      dismiss(modal, 'closing in test');
    });

    it('should not throw an exception on a second close', function () {

      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).toHaveBackdrop();

      modal.close('closing in test');
      $timeout.flush();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(0);

      modal.close('closing in test');
    });

    it('should open a modal from templateUrl', function () {

      $templateCache.put('content.html', '<div>URL Content</div>');
      var modal = open({templateUrl: 'content.html'});

      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('URL Content', 'div');
      expect($document).toHaveBackdrop();

      dismiss(modal, 'closing in test');

      expect($document).toHaveModalsOpen(0);

      waitForBackdropAnimation();
      expect($document).not.toHaveBackdrop();
    });

    it('should support closing on ESC', function () {

      var modal = open({template: '<div>Content</div>'});
      expect($document).toHaveModalsOpen(1);

      triggerKeyDown($document, 27);
      $timeout.flush();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(0);
    });

    it('should support closing on backdrop click', function () {

      var modal = open({template: '<div>Content</div>'});
      expect($document).toHaveModalsOpen(1);

      $document[0].querySelector('body > div.reveal-overlay').click();
      $timeout.flush();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(0);
    });

    it('should resolve returned promise on close', function () {
      var modal = open({template: '<div>Content</div>'});
      close(modal, 'closed ok');

      expect(modal.result).toBeResolvedWith('closed ok');
    });

    it('should reject returned promise on dismiss', function () {

      var modal = open({template: '<div>Content</div>'});
      dismiss(modal, 'esc');

      expect(modal.result).toBeRejectedWith('esc');
    });

    it('should expose a promise linked to the templateUrl / resolve promises', function () {
      var modal = open({template: '<div>Content</div>', resolve: {
          ok: function() {return $q.when('ok');}
        }}
      );
      expect(modal.opened).toBeResolvedWith(true);
    });

    it('should expose a promise linked to the templateUrl / resolve promises and reject it if needed', function () {
      var modal = open({template: '<div>Content</div>', resolve: {
          ok: function() {return $q.reject('ko');}
        }}
      );
      expect(modal.opened).toBeRejectedWith(false);
    });

    it('should destroy modal scope on close', function () {
      expect($rootScope.$$childTail).toEqual(null);

      var modal = open({template: '<div>Content</div>'});
      expect($rootScope.$$childTail).not.toEqual(null);

      close(modal, 'closed ok');
      waitForBackdropAnimation();
      expect($document).toHaveModalsOpen(0);

      $timeout.flush();
      expect($rootScope.$$childTail).toEqual(null);
    });

    describe("$modalInstance.reposition()", function() {
      it('should re-calculate the modal margin top', function () {
        $window.pageYOffset = 400;
        var modal = open({template: '<div>Content</div>'});
        expect($document).toHaveModalOpenWithStyle('top', '400px');

        $window.pageYOffset = 500;
        modal.reposition();
        expect($document).toHaveModalOpenWithStyle('top', '500px');
      });
    });
  });

  describe('default options can be changed in a provider', function () {

    it('should allow overriding default options in a provider', function () {
      $modalProvider.options.backdrop = false;
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).not.toHaveBackdrop();
    });

    it('should accept new objects with default options in a provider', function () {

      $modalProvider.options = {
        backdrop: false
      };
      var modal = open({template: '<div>Content</div>'});

      expect($document).toHaveModalOpenWithContent('Content', 'div');
      expect($document).not.toHaveBackdrop();
    });
  });

  describe('option by option', function () {

    describe('template and templateUrl', function () {

      it('should throw an error if none of template and templateUrl are provided', function () {
        expect(function(){
          var modal = open({});
        }).toThrow(new Error('One of template or templateUrl options is required.'));
      });

      it('should not fail if a templateUrl contains leading / trailing white spaces', function () {

        $templateCache.put('whitespace.html', '  <div>Whitespaces</div>  ');
        open({templateUrl: 'whitespace.html'});
        expect($document).toHaveModalOpenWithContent('Whitespaces', 'div');
      });

    });

    describe('controller', function () {

      it('should accept controllers and inject modal instances', function () {
        var TestCtrl = function($scope, $modalInstance) {
          $scope.fromCtrl = 'Content from ctrl';
          $scope.isModalInstance = angular.isObject($modalInstance) && angular.isFunction($modalInstance.close);
        };

        var modal = open({template: '<div>{{fromCtrl}} {{isModalInstance}}</div>', controller: TestCtrl});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

      it('should accept controller-as syntax in `controller` option', function () {
        $controllerProvider.register('TestCtrl', function($modalInstance) {
          this.fromCtrl = 'Content from ctrl';
          this.isModalInstance = angular.isObject($modalInstance) && angular.isFunction($modalInstance.close);
        });

        var modal = open({template: '<div>{{test.fromCtrl}} {{test.isModalInstance}}</div>', controller: 'TestCtrl as test'});
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

      it('should accept `controllerAs` option', function () {
        var modal = open({
          template: '<div>{{test.fromCtrl}} {{test.isModalInstance}}</div>',
          controller: function($modalInstance) {
            this.fromCtrl = 'Content from ctrl';
            this.isModalInstance = angular.isObject($modalInstance) && angular.isFunction($modalInstance.close);
          },
          controllerAs: 'test'
        });
        expect($document).toHaveModalOpenWithContent('Content from ctrl true', 'div');
      });

    });

    describe('resolve', function () {

      var ExposeCtrl = function($scope, value) {
        $scope.value = value;
      };

      function modalDefinition(template, resolve) {
        return {
          template: template,
          controller: ExposeCtrl,
          resolve: resolve
        };
      }

      it('should resolve simple values', function () {
        open(modalDefinition('<div>{{value}}</div>', {
          value: function () {
            return 'Content from resolve';
          }
        }));

        expect($document).toHaveModalOpenWithContent('Content from resolve', 'div');
      });

      it('should delay showing modal if one of the resolves is a promise', function () {

        open(modalDefinition('<div>{{value}}</div>', {
          value: function () {
            return $timeout(function(){ return 'Promise'; }, 100);
          }
        }));
        expect($document).toHaveModalsOpen(0);

        $timeout.flush();
        expect($document).toHaveModalOpenWithContent('Promise', 'div');
      });

      it('should not open dialog (and reject returned promise) if one of resolve fails', function () {

        var deferred = $q.defer();

        var modal = open(modalDefinition('<div>{{value}}</div>', {
          value: function () {
            return deferred.promise;
          }
        }));
        expect($document).toHaveModalsOpen(0);

        deferred.reject('error in test');
        $rootScope.$digest();

        expect($document).toHaveModalsOpen(0);
        expect(modal.result).toBeRejectedWith('error in test');
      });

      it('should support injection with minification-safe syntax in resolve functions', function () {

        open(modalDefinition('<div>{{value.id}}</div>', {
          value: ['$locale', function (e) {
            return e;
          }]
        }));

        expect($document).toHaveModalOpenWithContent('en-us', 'div');
      });

      //TODO: resolves with dependency injection - do we want to support them?
    });

    describe('scope', function () {

      it('should custom scope if provided', function () {
        var $scope = $rootScope.$new();
        $scope.fromScope = 'Content from custom scope';
        open({
          template: '<div>{{fromScope}}</div>',
          scope: $scope
        });
        expect($document).toHaveModalOpenWithContent('Content from custom scope', 'div');
      });
    });

    describe('parent', function () {
      beforeEach(function(){
        $document.find('body').append('<modal><modal>');
      });

      it('should use an element other than body as the parent if provided', function () {
        open({
          template: '<div>Parent other than body</div>',
          parent: 'modal'
        });
        expect($document).toHaveModalOpenInOtherParent('modal');
      });

      afterEach(function(){
        $document.find('body').find('modal').remove();
      });
    });

    describe('keyboard', function () {

      it('should not close modals if keyboard option is set to false', function () {
        open({
          template: '<div>No keyboard</div>',
          keyboard: false
        });

        expect($document).toHaveModalsOpen(1);

        triggerKeyDown($document, 27);
        $rootScope.$digest();

        expect($document).toHaveModalsOpen(1);
      });
    });

    describe('backdrop', function () {

      it('should not have any backdrop element if backdrop set to false', function () {
        var modal =open({
          template: '<div>No backdrop</div>',
          backdrop: false
        });
        expect($document).toHaveModalOpenWithContent('No backdrop', 'div');
        expect($document).not.toHaveBackdrop();

        dismiss(modal);
        expect($document).toHaveModalsOpen(0);
      });

      it('should not close modal on backdrop click if backdrop is specified as "static"', function () {
        open({
          template: '<div>Static backdrop</div>',
          backdrop: 'static'
        });

        $document[0].querySelector('body > div.reveal-overlay').click();
        $rootScope.$digest();

        expect($document).toHaveModalOpenWithContent('Static backdrop', 'div');
        expect($document).toHaveBackdrop();
      });

      it('should animate backdrop on each modal opening', function () {

        var modal = open({ template: '<div>With backdrop</div>' });
        var backdropEl = angular.element($document[0].querySelector('body > div.reveal-overlay'));
        expect(backdropEl).not.toHaveClass('in');

        $timeout.flush();
        expect(backdropEl).toHaveClass('in');

        dismiss(modal);
        waitForBackdropAnimation();

        modal = open({ template: '<div>With backdrop</div>' });
        backdropEl = angular.element($document[0].querySelector('body > div.reveal-overlay'));
        expect(backdropEl).not.toHaveClass('in');

      });
    });

    describe('custom window classes', function () {

      it('should support additional window class as string', function () {
        open({
          template: '<div>With custom window class</div>',
          windowClass: 'additional'
        });

        expect(angular.element($document[0].querySelector('div.reveal'))).toHaveClass('additional');
      });
    });
  });

  describe('multiple modals', function () {

    it('it should allow opening of multiple modals', function () {

      var modal1 = open({template: '<div>Modal1</div>'});
      var modal2 = open({template: '<div>Modal2</div>'});
      expect($document).toHaveModalsOpen(2);

      dismiss(modal2);
      expect($document).toHaveModalsOpen(1);
      expect($document).toHaveModalOpenWithContent('Modal1', 'div');

      dismiss(modal1);
      expect($document).toHaveModalsOpen(0);
    });

    it('should not close any modals on ESC if the topmost one does not allow it', function () {

      var modal1 = open({template: '<div>Modal1</div>'});
      var modal2 = open({template: '<div>Modal2</div>', keyboard: false});

      triggerKeyDown($document, 27);
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(2);
    });

    it('should not close any modals on click if a topmost modal does not have backdrop', function () {
      expect($document).toHaveModalsOpen(0);

      var modal1 = open({template: '<div>Modal1</div>'});
      var modal2 = open({template: '<div>Modal2</div>', backdrop: false});

      $document[0].querySelector('body > div.reveal-overlay').click();
      $rootScope.$digest();

      expect($document).toHaveModalsOpen(2);
    });

    it('multiple modals should not interfere with default options', function () {

      var modal1 = open({template: '<div>Modal1</div>', backdrop: false});
      var modal2 = open({template: '<div>Modal2</div>'});
      $rootScope.$digest();

      expect($document).toHaveBackdrop();
    });

    it('should add "is-reveal-open" class when a modal gets opened', function () {

      var body = $document.find('body');
      expect(body).not.toHaveClass('is-reveal-open');

      var modal1 = open({template: '<div>Content1</div>'});
      expect(body).toHaveClass('is-reveal-open');

      var modal2 = open({template: '<div>Content1</div>'});
      expect(body).toHaveClass('is-reveal-open');

      dismiss(modal1);
      expect(body).toHaveClass('is-reveal-open');

      dismiss(modal2);
      expect(body).not.toHaveClass('is-reveal-open');
    });
  });
});
