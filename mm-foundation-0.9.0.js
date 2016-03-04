'use strict';

/*
 * angular-foundation-6
 * http://circlingthesun.github.io/angular-foundation-6/

 * Version: 0.9.0 - 2016-03-04
 * License: MIT
 * (c) 
 */

AccordionController.$inject = ['$scope', '$attrs', 'accordionConfig'];
DropdownToggleController.$inject = ['$scope', '$attrs', 'mediaQueries', '$element', '$position', '$window'];
function AccordionController($scope, $attrs, accordionConfig) {
    'ngInject';

    var $ctrl = this;
    // This array keeps track of the accordion groups
    $ctrl.groups = [];

    // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
    $ctrl.closeOthers = function (openGroup) {
        var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
        if (closeOthers) {
            angular.forEach(this.groups, function (group) {
                if (group !== openGroup) {
                    group.isOpen = false;
                }
            });
        }
    };

    // This is called from the accordion-group directive to add itself to the accordion
    $ctrl.addGroup = function (groupScope) {
        var that = this;
        this.groups.push(groupScope);
    };

    // This is called from the accordion-group directive when to remove itself
    $ctrl.removeGroup = function (group) {
        var index = this.groups.indexOf(group);
        if (index !== -1) {
            this.groups.splice(index, 1);
        }
    };
}

angular.module('mm.foundation.accordion', []).constant('accordionConfig', {
    closeOthers: true
}).controller('AccordionController', AccordionController)

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
.directive('accordion', function () {
    'ngInject';

    return {
        restrict: 'EA',
        controller: AccordionController,
        controllerAs: '$ctrl',
        transclude: true,
        replace: false,
        templateUrl: 'template/accordion/accordion.html'
    };
})

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
.directive('accordionGroup', function () {
    'ngInject';

    return {
        require: { 'accordion': '^accordion' }, // We need this directive to be inside an accordion
        restrict: 'EA',
        transclude: true, // It transcludes the contents of the directive into the template
        replace: true, // The element containing the directive will be replaced with the template
        templateUrl: 'template/accordion/accordion-group.html',
        scope: {},
        controllerAs: "$ctrl",
        bindToController: {
            heading: '@'
        }, // Create an isolated scope and interpolate the heading attribute onto this scope
        controller: ['$scope', '$attrs', '$parse', function accordionGroupController($scope, $attrs, $parse) {
            'ngInject';

            var $ctrl = this;
            $ctrl.isOpen = false;

            $ctrl.setHTMLHeading = function (element) {
                $ctrl.HTMLHeading = element;
            };

            $ctrl.$onInit = function () {
                $ctrl.accordion.addGroup($ctrl);

                $scope.$on('$destroy', function (event) {
                    $ctrl.accordion.removeGroup($ctrl);
                });

                var getIsOpen;
                var setIsOpen;

                if ($attrs.isOpen) {
                    getIsOpen = $parse($attrs.isOpen);
                    setIsOpen = getIsOpen.assign;

                    $scope.$parent.$watch(getIsOpen, function (value) {
                        $ctrl.isOpen = !!value;
                    });
                }

                $scope.$watch(function () {
                    return $ctrl.isOpen;
                }, function (value) {
                    if (value) {
                        $ctrl.accordion.closeOthers($ctrl);
                    }
                    setIsOpen && setIsOpen($scope.$parent, value);
                });
            };
        }]
    };
})

// Use accordion-heading below an accordion-group to provide a heading containing HTML
// <accordion-group>
//   <accordion-heading>Heading containing HTML - <img src="..."></accordion-heading>
// </accordion-group>
.directive('accordionHeading', function () {
    'ngInject';

    return {
        restrict: 'EA',
        transclude: true, // Grab the contents to be used as the heading
        template: '', // In effect remove this element!
        replace: true,
        require: '^accordionGroup',
        link: function link(scope, element, attr, accordionGroupCtrl, transclude) {
            // Pass the heading to the accordion-group controller
            // so that it can be transcluded into the right place in the template
            // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
            accordionGroupCtrl.setHTMLHeading(transclude(scope, function () {}));
        }
    };
})

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
// <div class="accordion-group">
//   <div class="accordion-heading" ><a ... accordion-transclude="heading">...</a></div>
//   ...
// </div>
.directive('accordionTransclude', function () {
    'ngInject';

    return {
        require: '^accordionGroup',
        link: function link(scope, element, attr, accordionGroupController) {
            scope.$watch(function () {
                return accordionGroupController.HTMLHeading;
            }, function (heading) {
                if (heading) {
                    element.html('');
                    element.append(heading);
                }
            });
        }
    };
});

angular.module("mm.foundation.alert", []).controller('AlertController', ['$scope', '$attrs', function ($scope, $attrs) {
    'ngInject';

    $scope.closeable = 'close' in $attrs && typeof $attrs.close !== "undefined";
}]).directive('alert', function () {
    'ngInject';

    return {
        restrict: 'EA',
        controller: 'AlertController',
        templateUrl: 'template/alert/alert.html',
        transclude: true,
        replace: true,
        scope: {
            type: '=',
            close: '&'
        }
    };
});

angular.module('mm.foundation.bindHtml', []).directive('bindHtmlUnsafe', function () {
    'ngInject';

    return function (scope, element, attr) {
        element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
        scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
            element.html(value || '');
        });
    };
});

angular.module('mm.foundation.buttons', []).constant('buttonConfig', {
    activeClass: 'active',
    toggleEvent: 'click'
}).controller('ButtonsController', ['buttonConfig', function (buttonConfig) {
    this.activeClass = buttonConfig.activeClass;
    this.toggleEvent = buttonConfig.toggleEvent;
}]).directive('btnRadio', function () {
    'ngInject';

    return {
        require: ['btnRadio', 'ngModel'],
        controller: 'ButtonsController',
        link: function link(scope, element, attrs, ctrls) {
            var buttonsCtrl = ctrls[0],
                ngModelCtrl = ctrls[1];

            //model -> UI
            ngModelCtrl.$render = function () {
                element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
            };

            //ui->model
            element.bind(buttonsCtrl.toggleEvent, function () {
                if (!element.hasClass(buttonsCtrl.activeClass)) {
                    scope.$apply(function () {
                        ngModelCtrl.$setViewValue(scope.$eval(attrs.btnRadio));
                        ngModelCtrl.$render();
                    });
                }
            });
        }
    };
}).directive('btnCheckbox', function () {
    'ngInject';

    return {
        require: ['btnCheckbox', 'ngModel'],
        controller: 'ButtonsController',
        link: function link(scope, element, attrs, ctrls) {
            var buttonsCtrl = ctrls[0],
                ngModelCtrl = ctrls[1];

            function getTrueValue() {
                return getCheckboxValue(attrs.btnCheckboxTrue, true);
            }

            function getFalseValue() {
                return getCheckboxValue(attrs.btnCheckboxFalse, false);
            }

            function getCheckboxValue(attributeValue, defaultValue) {
                var val = scope.$eval(attributeValue);
                return angular.isDefined(val) ? val : defaultValue;
            }

            //model -> UI
            ngModelCtrl.$render = function () {
                element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, getTrueValue()));
            };

            //ui->model
            element.bind(buttonsCtrl.toggleEvent, function () {
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(element.hasClass(buttonsCtrl.activeClass) ? getFalseValue() : getTrueValue());
                    ngModelCtrl.$render();
                });
            });
        }
    };
});

/*
 * dropdownToggle - Provides dropdown menu functionality
 * @restrict class or attribute
 * @example:

   <a dropdown-toggle="#dropdown-menu">My Dropdown Menu</a>
   <ul id="dropdown-menu" class="f-dropdown">
     <li ng-repeat="choice in dropChoices">
       <a ng-href="{{choice.href}}">{{choice.text}}</a>
     </li>
   </ul>
 */
var mod = angular.module('mm.foundation.dropdownToggle', ['mm.foundation.position', 'mm.foundation.mediaQueries']);

function DropdownToggleController($scope, $attrs, mediaQueries, $element, $position, $window) {
    'ngInject';

    var $ctrl = this;

    $ctrl.css = {};

    $ctrl.toggle = function () {
        $ctrl.active = !$ctrl.active;

        $ctrl.css = {};

        if (!$ctrl.active) {
            return;
        }

        var dropdown = angular.element($element[0].querySelector('.dropdown-pane'));
        var dropdownTrigger = angular.element($element[0].querySelector('toggle'));

        var dropdownWidth = dropdown.prop('offsetWidth');
        var triggerPosition = $position.position(dropdownTrigger);

        $ctrl.css.top = triggerPosition.top + triggerPosition.height + 5 + 'px';
        $ctrl.css.left = triggerPosition.left + 'px';

        if (mediaQueries.small() && !mediaQueries.medium()) {}
    };
}

mod.directive('dropdownToggle', ['$document', '$window', '$location', '$position', function ($document, $window, $location, $position) {
    'ngInject';

    var openElement = null;
    var closeMenu = angular.noop;
    return {
        scope: {},
        restrict: 'EA',
        transclude: {
            'toggle': 'toggle',
            'pane': 'pane'
        },
        templateUrl: 'template/dropdownToggle/dropdownToggle.html',
        controller: DropdownToggleController,
        controllerAs: '$ctrl'
    };
}]);

angular.module("mm.foundation.mediaQueries", []).factory('matchMedia', ['$document', '$window', function ($document, $window) {
    'ngInject';
    // MatchMedia for IE <= 9

    return $window.matchMedia || function matchMedia(doc, undefined) {
        var bool,
            docElem = doc.documentElement,
            refNode = docElem.firstElementChild || docElem.firstChild,

        // fakeBody required for <FF4 when executed in <head>
        fakeBody = doc.createElement("body"),
            div = doc.createElement("div");

        div.id = "mq-test-1";
        div.style.cssText = "position:absolute;top:-100em";
        fakeBody.style.background = "none";
        fakeBody.appendChild(div);

        return function (q) {
            div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";
            docElem.insertBefore(fakeBody, refNode);
            bool = div.offsetWidth === 42;
            docElem.removeChild(fakeBody);
            return {
                matches: bool,
                media: q
            };
        };
    }($document[0]);
}]).factory('mediaQueries', ['$document', 'matchMedia', function ($document, matchMedia) {
    'ngInject';

    var head = angular.element($document[0].querySelector('head'));
    head.append('<meta class="foundation-mq-topbar" />');
    head.append('<meta class="foundation-mq-small" />');
    head.append('<meta class="foundation-mq-medium" />');
    head.append('<meta class="foundation-mq-large" />');

    var regex = /^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g;
    var queries = {
        topbar: getComputedStyle(head[0].querySelector('meta.foundation-mq-topbar')).fontFamily.replace(regex, ''),
        small: getComputedStyle(head[0].querySelector('meta.foundation-mq-small')).fontFamily.replace(regex, ''),
        medium: getComputedStyle(head[0].querySelector('meta.foundation-mq-medium')).fontFamily.replace(regex, ''),
        large: getComputedStyle(head[0].querySelector('meta.foundation-mq-large')).fontFamily.replace(regex, '')
    };

    return {
        topbarBreakpoint: function topbarBreakpoint() {
            return !matchMedia(queries.topbar).matches;
        },
        small: function small() {
            return matchMedia(queries.small).matches;
        },
        medium: function medium() {
            return matchMedia(queries.medium).matches;
        },
        large: function large() {
            return matchMedia(queries.large).matches;
        }
    };
}]);

angular.module('mm.foundation.modal', [])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
.factory('$$stackedMap', function () {
    'ngInject';

    return {
        createNew: function createNew() {
            var stack = [];

            return {
                add: function add(key, value) {
                    stack.push({
                        key: key,
                        value: value
                    });
                },
                get: function get(key) {
                    for (var i = 0; i < stack.length; i++) {
                        if (key == stack[i].key) {
                            return stack[i];
                        }
                    }
                },
                keys: function keys() {
                    var keys = [];
                    for (var i = 0; i < stack.length; i++) {
                        keys.push(stack[i].key);
                    }
                    return keys;
                },
                top: function top() {
                    return stack[stack.length - 1];
                },
                remove: function remove(key) {
                    var idx = -1;
                    for (var i = 0; i < stack.length; i++) {
                        if (key == stack[i].key) {
                            idx = i;
                            break;
                        }
                    }
                    return stack.splice(idx, 1)[0];
                },
                removeTop: function removeTop() {
                    return stack.splice(stack.length - 1, 1)[0];
                },
                length: function length() {
                    return stack.length;
                }
            };
        }
    };
})

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
.directive('modalBackdrop', ['$modalStack', '$timeout', function ($modalStack, $timeout) {
    'ngInject';

    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/modal/backdrop.html',
        link: function link(scope) {

            scope.close = function (evt) {
                var modal = $modalStack.getTop();
                if (modal && modal.value.backdrop && modal.value.backdrop !== 'static' && evt.target === evt.currentTarget) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    $modalStack.dismiss(modal.key, 'backdrop click');
                }
            };
        }
    };
}]).directive('modalWindow', ['$modalStack', '$timeout', function ($modalStack, $timeout) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            index: '@'
        },
        replace: true,
        transclude: true,
        templateUrl: 'template/modal/window.html',
        link: function link(scope, element, attrs) {
            scope.windowClass = attrs.windowClass || '';
        }
    };
}]).factory('$modalStack', ['$window', '$timeout', '$document', '$compile', '$rootScope', '$$stackedMap', '$animate', '$q', function ($window, $timeout, $document, $compile, $rootScope, $$stackedMap, $animate, $q) {

    var body = $document.find('body').eq(0);
    var OPENED_MODAL_CLASS = 'is-reveal-open';
    var backdropDomEl;
    var backdropScope;
    var openedWindows = $$stackedMap.createNew();
    var $modalStack = {};

    function backdropIndex() {
        var topBackdropIndex = -1;
        var opened = openedWindows.keys();
        for (var i = 0; i < opened.length; i++) {
            if (openedWindows.get(opened[i]).value.backdrop) {
                topBackdropIndex = i;
            }
        }
        return topBackdropIndex;
    }

    $rootScope.$watch(backdropIndex, function (newBackdropIndex) {
        if (backdropScope) {
            backdropScope.index = newBackdropIndex;
        }
    });

    function resizeHandler() {
        var opened = openedWindows.keys();
        var fixedPositiong = true;
        for (var i = 0; i < opened.length; i++) {
            var modalPos = $modalStack.reposition(opened[i]);
            if (modalPos && modalPos.position !== 'fixed') {
                fixedPositiong = false;
            }
        }
        if (fixedPositiong) {
            body.addClass(OPENED_MODAL_CLASS);
        } else {
            body.removeClass(OPENED_MODAL_CLASS);
        }
    }

    function removeModalWindow(modalInstance) {
        var body = $document.find('body').eq(0);
        var modalWindow = openedWindows.get(modalInstance).value;

        // clean up the stack
        openedWindows.remove(modalInstance);

        // remove window DOM element
        $animate.leave(modalWindow.modalDomEl);
        checkRemoveBackdrop();
        if (openedWindows.length() === 0) {
            body.removeClass(OPENED_MODAL_CLASS);
            angular.element($window).unbind('resize', resizeHandler);
        }
    }

    function checkRemoveBackdrop() {
        // remove backdrop if no longer needed
        if (backdropDomEl && backdropIndex() === -1) {
            var backdropScopeRef = backdropScope;

            $animate.leave(backdropDomEl).then(function () {
                backdropScopeRef.$destroy();
                backdropScopeRef = null;
            });
            backdropDomEl = undefined;
            backdropScope = undefined;
        }
    }

    function getModalCenter(modalInstance) {

        var options = modalInstance.options;
        var el = options.modalDomEl;

        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        var width = el[0].offsetWidth;
        var height = el[0].offsetHeight;

        var left = parseInt((windowWidth - width) / 2, 10);
        var top;
        if (height > windowHeight) {
            top = parseInt(Math.min(100, windowHeight / 10), 10);
        } else {
            top = parseInt((windowHeight - height) / 4, 10);
        }

        var fitsWindow = windowHeight >= top + height;

        var modalPos = options.modalPos = options.modalPos || {};

        if (modalPos.windowHeight !== windowHeight) {
            modalPos.scrollY = $window.pageYOffset || 0;
        }

        if (modalPos.position !== 'fixed') {
            modalPos.top = fitsWindow ? top : top + modalPos.scrollY;
        }
        modalPos.left = left;
        modalPos.position = fitsWindow ? 'fixed' : 'absolute';
        modalPos.windowHeight = windowHeight;

        return modalPos;
    }

    $document.bind('keydown', function (evt) {
        var modal;

        if (evt.which === 27) {
            modal = openedWindows.top();
            if (modal && modal.value.keyboard) {
                $rootScope.$apply(function () {
                    $modalStack.dismiss(modal.key);
                });
            }
        }
    });

    $modalStack.open = function (modalInstance, options) {
        modalInstance.options = {
            deferred: options.deferred,
            modalScope: options.scope,
            backdrop: options.backdrop,
            keyboard: options.keyboard
        };
        openedWindows.add(modalInstance, modalInstance.options);

        var currBackdropIndex = backdropIndex();

        if (currBackdropIndex >= 0 && !backdropDomEl) {
            backdropScope = $rootScope.$new(true);
            backdropScope.index = currBackdropIndex;
            backdropDomEl = $compile('<div modal-backdrop></div>')(backdropScope);
        }

        if (openedWindows.length() === 1) {
            angular.element($window).bind('resize', resizeHandler);
        }

        var modalDomEl = angular.element('<div modal-window></div>').attr({
            'style': 'visibility: visible; z-index: -1; display: block;',
            'window-class': options.windowClass,
            'index': openedWindows.length() - 1
        });
        modalDomEl.html(options.content);
        $compile(modalDomEl)(options.scope);

        return $timeout(function () {
            // let the directives kick in
            options.scope.$apply();

            openedWindows.top().value.modalDomEl = modalDomEl;

            // Attach, measure, remove
            body.prepend(modalDomEl);
            var modalPos = getModalCenter(modalInstance, true);
            modalDomEl.detach();

            modalDomEl.attr({
                'style': 'visibility: visible; top: ' + modalPos.top + 'px; left: ' + modalPos.left + 'px; display: block; position: ' + modalPos.position + ';'
            });

            var promises = [];

            if (backdropDomEl) {
                promises.push($animate.enter(backdropDomEl, body));
            }
            promises.push($animate.enter(modalDomEl, body));
            if (modalPos.position === 'fixed') {
                body.addClass(OPENED_MODAL_CLASS);
            }

            return $q.all(promises).then(function () {
                // VERY BAD: This moves the modal
                // // If the modal contains any autofocus elements refocus onto the first one
                // if (modalDomEl[0].querySelectorAll('[autofocus]').length > 0) {
                //     modalDomEl[0].querySelectorAll('[autofocus]')[0].focus();
                // } else {
                //     // otherwise focus the freshly-opened modal
                //     modalDomEl[0].focus();
                // }
            });
        });
    };

    $modalStack.reposition = function (modalInstance) {
        var modalWindow = openedWindows.get(modalInstance).value;
        if (modalWindow) {
            var modalDomEl = modalWindow.modalDomEl;
            var modalPos = getModalCenter(modalInstance);
            modalDomEl.css('top', modalPos.top + 'px');
            modalDomEl.css('left', modalPos.left + 'px');
            modalDomEl.css('position', modalPos.position);
            return modalPos;
        }
    };

    $modalStack.close = function (modalInstance, result) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
            modalWindow.value.deferred.resolve(result);
            removeModalWindow(modalInstance);
        }
    };

    $modalStack.dismiss = function (modalInstance, reason) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
            modalWindow.value.deferred.reject(reason);
            removeModalWindow(modalInstance);
        }
    };

    $modalStack.dismissAll = function (reason) {
        var topModal = this.getTop();
        while (topModal) {
            this.dismiss(topModal.key, reason);
            topModal = this.getTop();
        }
    };

    $modalStack.getTop = function () {
        return openedWindows.top();
    };

    return $modalStack;
}]).provider('$modal', function () {
    'ngInject';

    var $modalProvider = {
        options: {
            backdrop: true, //can be also false or 'static'
            keyboard: true
        },
        $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$modalStack', function $get($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {
            'ngInject';

            var $modal = {};

            function getTemplatePromise(options) {
                if (options.template) {
                    return $q.when(options.template);
                }
                return $http.get(options.templateUrl, {
                    cache: $templateCache
                }).then(function (result) {
                    return result.data;
                });
            }

            function getResolvePromises(resolves) {
                var promisesArr = [];
                angular.forEach(resolves, function (value, key) {
                    if (angular.isFunction(value) || angular.isArray(value)) {
                        promisesArr.push($q.when($injector.invoke(value)));
                    }
                });
                return promisesArr;
            }

            $modal.open = function (modalOpts) {

                var modalResultDeferred = $q.defer();
                var modalOpenedDeferred = $q.defer();

                // prepare an instance of a modal to be injected into controllers and returned to a caller
                var modalInstance = {
                    result: modalResultDeferred.promise,
                    opened: modalOpenedDeferred.promise,
                    close: function close(result) {
                        $modalStack.close(modalInstance, result);
                    },
                    dismiss: function dismiss(reason) {
                        $modalStack.dismiss(modalInstance, reason);
                    }
                };

                // merge and clean up options
                // reposition: function() {
                //     $modalStack.reposition(modalInstance);
                // }
                var modalOptions = angular.extend({}, $modalProvider.options, modalOpts);
                modalOptions.resolve = modalOptions.resolve || {};

                // verify options
                if (!modalOptions.template && !modalOptions.templateUrl) {
                    throw new Error('One of template or templateUrl options is required.');
                }

                var templateAndResolvePromise = $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));

                var openedPromise = templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {
                    var modalScope = (modalOptions.scope || $rootScope).$new();
                    modalScope.$close = modalInstance.close;
                    modalScope.$dismiss = modalInstance.dismiss;

                    var ctrlInstance;
                    var ctrlLocals = {};
                    var resolveIter = 1;

                    // controllers
                    if (modalOptions.controller) {
                        ctrlLocals.$scope = modalScope;
                        ctrlLocals.$modalInstance = modalInstance;
                        angular.forEach(modalOptions.resolve, function (value, key) {
                            ctrlLocals[key] = tplAndVars[resolveIter++];
                        });

                        ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                        if (modalOptions.controllerAs) {
                            modalScope[modalOptions.controllerAs] = ctrlInstance;
                        }
                    }

                    return $modalStack.open(modalInstance, {
                        scope: modalScope,
                        deferred: modalResultDeferred,
                        content: tplAndVars[0],
                        backdrop: modalOptions.backdrop,
                        keyboard: modalOptions.keyboard,
                        windowClass: modalOptions.windowClass
                    });
                }, function resolveError(reason) {
                    modalResultDeferred.reject(reason);
                });

                openedPromise.then(function () {
                    modalOpenedDeferred.resolve(true);
                }, function () {
                    modalOpenedDeferred.reject(false);
                });

                return modalInstance;
            };

            return $modal;
        }]
    };

    return $modalProvider;
});

angular.module('mm.foundation.pagination', []).controller('PaginationController', ['$scope', '$attrs', '$parse', '$interpolate', function ($scope, $attrs, $parse, $interpolate) {
    var self = this,
        setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;

    this.init = function (defaultItemsPerPage) {
        if ($attrs.itemsPerPage) {
            $scope.$parent.$watch($parse($attrs.itemsPerPage), function (value) {
                self.itemsPerPage = parseInt(value, 10);
                $scope.totalPages = self.calculateTotalPages();
            });
        } else {
            this.itemsPerPage = defaultItemsPerPage;
        }
    };

    this.noPrevious = function () {
        return this.page === 1;
    };
    this.noNext = function () {
        return this.page === $scope.totalPages;
    };

    this.isActive = function (page) {
        return this.page === page;
    };

    this.calculateTotalPages = function () {
        var totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
        return Math.max(totalPages || 0, 1);
    };

    this.getAttributeValue = function (attribute, defaultValue, interpolate) {
        return angular.isDefined(attribute) ? interpolate ? $interpolate(attribute)($scope.$parent) : $scope.$parent.$eval(attribute) : defaultValue;
    };

    this.render = function () {
        this.page = parseInt($scope.page, 10) || 1;
        if (this.page > 0 && this.page <= $scope.totalPages) {
            $scope.pages = this.getPages(this.page, $scope.totalPages);
        }
    };

    $scope.selectPage = function (page) {
        if (!self.isActive(page) && page > 0 && page <= $scope.totalPages) {
            $scope.page = page;
            $scope.onSelectPage({
                page: page
            });
        }
    };

    $scope.$watch('page', function () {
        self.render();
    });

    $scope.$watch('totalItems', function () {
        $scope.totalPages = self.calculateTotalPages();
    });

    $scope.$watch('totalPages', function (value) {
        setNumPages($scope.$parent, value); // Readonly variable

        if (self.page > value) {
            $scope.selectPage(value);
        } else {
            self.render();
        }
    });
}]).constant('paginationConfig', {
    itemsPerPage: 10,
    boundaryLinks: false,
    directionLinks: true,
    firstText: 'First',
    previousText: 'Previous',
    nextText: 'Next',
    lastText: 'Last',
    rotate: true
}).directive('pagination', ['$parse', 'paginationConfig', function ($parse, paginationConfig) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            page: '=',
            totalItems: '=',
            onSelectPage: ' &'
        },
        controller: 'PaginationController',
        templateUrl: 'template/pagination/pagination.html',
        replace: true,
        link: function link(scope, element, attrs, paginationCtrl) {

            // Setup configuration parameters
            var maxSize,
                boundaryLinks = paginationCtrl.getAttributeValue(attrs.boundaryLinks, paginationConfig.boundaryLinks),
                directionLinks = paginationCtrl.getAttributeValue(attrs.directionLinks, paginationConfig.directionLinks),
                firstText = paginationCtrl.getAttributeValue(attrs.firstText, paginationConfig.firstText, true),
                previousText = paginationCtrl.getAttributeValue(attrs.previousText, paginationConfig.previousText, true),
                nextText = paginationCtrl.getAttributeValue(attrs.nextText, paginationConfig.nextText, true),
                lastText = paginationCtrl.getAttributeValue(attrs.lastText, paginationConfig.lastText, true),
                rotate = paginationCtrl.getAttributeValue(attrs.rotate, paginationConfig.rotate);

            paginationCtrl.init(paginationConfig.itemsPerPage);

            if (attrs.maxSize) {
                scope.$parent.$watch($parse(attrs.maxSize), function (value) {
                    maxSize = parseInt(value, 10);
                    paginationCtrl.render();
                });
            }

            // Create page object used in template
            function makePage(number, text, isActive, isDisabled) {
                return {
                    number: number,
                    text: text,
                    active: isActive,
                    disabled: isDisabled
                };
            }

            paginationCtrl.getPages = function (currentPage, totalPages) {
                var pages = [];

                // Default page limits
                var startPage = 1,
                    endPage = totalPages;
                var isMaxSized = angular.isDefined(maxSize) && maxSize < totalPages;

                // recompute if maxSize
                if (isMaxSized) {
                    if (rotate) {
                        // Current page is displayed in the middle of the visible ones
                        startPage = Math.max(currentPage - Math.floor(maxSize / 2), 1);
                        endPage = startPage + maxSize - 1;

                        // Adjust if limit is exceeded
                        if (endPage > totalPages) {
                            endPage = totalPages;
                            startPage = endPage - maxSize + 1;
                        }
                    } else {
                        // Visible pages are paginated with maxSize
                        startPage = (Math.ceil(currentPage / maxSize) - 1) * maxSize + 1;

                        // Adjust last page if limit is exceeded
                        endPage = Math.min(startPage + maxSize - 1, totalPages);
                    }
                }

                // Add page number links
                for (var number = startPage; number <= endPage; number++) {
                    var page = makePage(number, number, paginationCtrl.isActive(number), false);
                    pages.push(page);
                }

                // Add links to move between page sets
                if (isMaxSized && !rotate) {
                    if (startPage > 1) {
                        var previousPageSet = makePage(startPage - 1, '...', false, false);
                        pages.unshift(previousPageSet);
                    }

                    if (endPage < totalPages) {
                        var nextPageSet = makePage(endPage + 1, '...', false, false);
                        pages.push(nextPageSet);
                    }
                }

                // Add previous & next links
                if (directionLinks) {
                    var previousPage = makePage(currentPage - 1, previousText, false, paginationCtrl.noPrevious());
                    pages.unshift(previousPage);

                    var nextPage = makePage(currentPage + 1, nextText, false, paginationCtrl.noNext());
                    pages.push(nextPage);
                }

                // Add first & last links
                if (boundaryLinks) {
                    var firstPage = makePage(1, firstText, false, paginationCtrl.noPrevious());
                    pages.unshift(firstPage);

                    var lastPage = makePage(totalPages, lastText, false, paginationCtrl.noNext());
                    pages.push(lastPage);
                }

                return pages;
            };
        }
    };
}]).constant('pagerConfig', {
    itemsPerPage: 10,
    previousText: '« Previous',
    nextText: 'Next »',
    align: true
}).directive('pager', ['pagerConfig', function (pagerConfig) {
    'ngInject';

    return {
        restrict: 'EA',
        scope: {
            page: '=',
            totalItems: '=',
            onSelectPage: ' &'
        },
        controller: 'PaginationController',
        templateUrl: 'template/pagination/pager.html',
        replace: true,
        link: function link(scope, element, attrs, paginationCtrl) {

            // Setup configuration parameters
            var previousText = paginationCtrl.getAttributeValue(attrs.previousText, pagerConfig.previousText, true),
                nextText = paginationCtrl.getAttributeValue(attrs.nextText, pagerConfig.nextText, true),
                align = paginationCtrl.getAttributeValue(attrs.align, pagerConfig.align);

            paginationCtrl.init(pagerConfig.itemsPerPage);

            // Create page object used in template
            function makePage(number, text, isDisabled, isPrevious, isNext) {
                return {
                    number: number,
                    text: text,
                    disabled: isDisabled,
                    previous: align && isPrevious,
                    next: align && isNext
                };
            }

            paginationCtrl.getPages = function (currentPage) {
                return [makePage(currentPage - 1, previousText, paginationCtrl.noPrevious(), true, false), makePage(currentPage + 1, nextText, paginationCtrl.noNext(), false, true)];
            };
        }
    };
}]);

angular.module('mm.foundation.position', [])

/**
 * A set of utility methods that can be use to retrieve position of DOM elements.
 * It is meant to be used where we need to absolute-position DOM elements in
 * relation to other, existing elements (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
.factory('$position', ['$document', '$window', function ($document, $window) {
    'ngInject';

    function getStyle(el, cssprop) {
        if (el.currentStyle) {
            //IE
            return el.currentStyle[cssprop];
        } else if ($window.getComputedStyle) {
            return $window.getComputedStyle(el)[cssprop];
        }
        // finally try and get inline style
        return el.style[cssprop];
    }

    /**
     * Checks if a given element is statically positioned
     * @param element - raw DOM element
     */
    function isStaticPositioned(element) {
        return (getStyle(element, "position") || 'static') === 'static';
    }

    /**
     * returns the closest, non-statically positioned parentOffset of a given element
     * @param element
     */
    var parentOffsetEl = function parentOffsetEl(element) {
        var docDomEl = $document[0];
        var offsetParent = element.offsetParent || docDomEl;
        while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent)) {
            offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || docDomEl;
    };

    return {
        /**
         * Provides read-only equivalent of jQuery's position function:
         * http://api.jquery.com/position/
         */
        position: function position(element) {
            var elBCR = this.offset(element);
            var offsetParentBCR = {
                top: 0,
                left: 0
            };
            var offsetParentEl = parentOffsetEl(element[0]);
            if (offsetParentEl != $document[0]) {
                offsetParentBCR = this.offset(angular.element(offsetParentEl));
                offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
                offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
            }

            var boundingClientRect = element[0].getBoundingClientRect();
            return {
                width: boundingClientRect.width || element.prop('offsetWidth'),
                height: boundingClientRect.height || element.prop('offsetHeight'),
                top: elBCR.top - offsetParentBCR.top,
                left: elBCR.left - offsetParentBCR.left
            };
        },

        /**
         * Provides read-only equivalent of jQuery's offset function:
         * http://api.jquery.com/offset/
         */
        offset: function offset(element) {
            var boundingClientRect = element[0].getBoundingClientRect();
            return {
                width: boundingClientRect.width || element.prop('offsetWidth'),
                height: boundingClientRect.height || element.prop('offsetHeight'),
                top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop || $document[0].documentElement.scrollTop),
                left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft || $document[0].documentElement.scrollLeft)
            };
        }
    };
}]);

/**
 * @ngdoc overview
 * @name mm.foundation.tabs
 *
 * @description
 * AngularJS version of the tabs directive.
 */

angular.module('mm.foundation.tabs', []).controller('TabsetController', ['$scope', function TabsetCtrl($scope) {
    'ngInject';

    var ctrl = this;
    var tabs = ctrl.tabs = $scope.tabs = [];

    if (angular.isUndefined($scope.openOnLoad)) {
        $scope.openOnLoad = true;
    }

    ctrl.select = function (tab) {
        angular.forEach(tabs, function (tab) {
            tab.active = false;
        });
        tab.active = true;
    };

    ctrl.addTab = function addTab(tab) {
        tabs.push(tab);
        if ($scope.openOnLoad && (tabs.length === 1 || tab.active)) {
            ctrl.select(tab);
        }
    };

    ctrl.removeTab = function removeTab(tab) {
        var index = tabs.indexOf(tab);
        //Select a new tab if the tab to be removed is selected
        if (tab.active && tabs.length > 1) {
            //If this is the last tab, select the previous tab. else, the next tab.
            var newActiveIndex = index == tabs.length - 1 ? index - 1 : index + 1;
            ctrl.select(tabs[newActiveIndex]);
        }
        tabs.splice(index, 1);
    };
}])

/**
 * @ngdoc directive
 * @name mm.foundation.tabs.directive:tabset
 * @restrict EA
 *
 * @description
 * Tabset is the outer container for the tabs directive
 *
 * @param {boolean=} vertical Whether or not to use vertical styling for the tabs.
 * @param {boolean=} justified Whether or not to use justified styling for the tabs.
 *
 * @example
<example module="mm.foundation">
  <file name="index.html">
    <tabset>
      <tab heading="Tab 1"><b>First</b> Content!</tab>
      <tab heading="Tab 2"><i>Second</i> Content!</tab>
    </tabset>
    <hr />
    <tabset vertical="true">
      <tab heading="Vertical Tab 1"><b>First</b> Vertical Content!</tab>
      <tab heading="Vertical Tab 2"><i>Second</i> Vertical Content!</tab>
    </tabset>
    <tabset justified="true">
      <tab heading="Justified Tab 1"><b>First</b> Justified Content!</tab>
      <tab heading="Justified Tab 2"><i>Second</i> Justified Content!</tab>
    </tabset>
  </file>
</example>
 */
.directive('tabset', function () {
    'ngInject';

    return {
        restrict: 'EA',
        transclude: true,
        replace: true,
        scope: {
            openOnLoad: '=?'
        },
        controller: 'TabsetController',
        templateUrl: 'template/tabs/tabset.html',
        link: function link(scope, element, attrs) {
            scope.vertical = angular.isDefined(attrs.vertical) ? scope.$parent.$eval(attrs.vertical) : false;
            scope.justified = angular.isDefined(attrs.justified) ? scope.$parent.$eval(attrs.justified) : false;
            scope.type = angular.isDefined(attrs.type) ? scope.$parent.$eval(attrs.type) : 'tabs';
        }
    };
})

/**
 * @ngdoc directive
 * @name mm.foundation.tabs.directive:tab
 * @restrict EA
 *
 * @param {string=} heading The visible heading, or title, of the tab. Set HTML headings with {@link mm.foundation.tabs.directive:tabHeading tabHeading}.
 * @param {string=} select An expression to evaluate when the tab is selected.
 * @param {boolean=} active A binding, telling whether or not this tab is selected.
 * @param {boolean=} disabled A binding, telling whether or not this tab is disabled.
 *
 * @description
 * Creates a tab with a heading and content. Must be placed within a {@link mm.foundation.tabs.directive:tabset tabset}.
 *
 * @example
<example module="mm.foundation">
  <file name="index.html">
    <div ng-controller="TabsDemoCtrl">
      <button class="button small" ng-click="items[0].active = true">
        Select item 1, using active binding
      </button>
      <button class="button small" ng-click="items[1].disabled = !items[1].disabled">
        Enable/disable item 2, using disabled binding
      </button>
      <br />
      <tabset>
        <tab heading="Tab 1">First Tab</tab>
        <tab select="alertMe()">
          <tab-heading><i class="fa fa-bell"></i> Alert me!</tab-heading>
          Second Tab, with alert callback and html heading!
        </tab>
        <tab ng-repeat="item in items"
          heading="{{item.title}}"
          disabled="item.disabled"
          active="item.active">
          {{item.content}}
        </tab>
      </tabset>
    </div>
  </file>
  <file name="script.js">
    function TabsDemoCtrl($scope) {
      $scope.items = [
        { title:"Dynamic Title 1", content:"Dynamic Item 0" },
        { title:"Dynamic Title 2", content:"Dynamic Item 1", disabled: true }
      ];

      $scope.alertMe = function() {
        setTimeout(function() {
          alert("You've selected the alert tab!");
        });
      };
    };
  </file>
</example>
 */

/**
 * @ngdoc directive
 * @name mm.foundation.tabs.directive:tabHeading
 * @restrict EA
 *
 * @description
 * Creates an HTML heading for a {@link mm.foundation.tabs.directive:tab tab}. Must be placed as a child of a tab element.
 *
 * @example
<example module="mm.foundation">
  <file name="index.html">
    <tabset>
      <tab>
        <tab-heading><b>HTML</b> in my titles?!</tab-heading>
        And some content, too!
      </tab>
      <tab>
        <tab-heading><i class="fa fa-heart"></i> Icon heading?!?</tab-heading>
        That's right.
      </tab>
    </tabset>
  </file>
</example>
 */
.directive('tab', ['$parse', function ($parse) {
    'ngInject';

    return {
        require: '^tabset',
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/tabs/tab.html',
        transclude: true,
        scope: {
            heading: '@',
            onSelect: '&select', //This callback is called in contentHeadingTransclude
            //once it inserts the tab's content into the dom
            onDeselect: '&deselect'
        },
        controller: function controller() {
            //Empty controller so other directives can require being 'under' a tab
        },
        compile: function compile(elm, attrs, transclude) {
            return function postLink(scope, elm, attrs, tabsetCtrl) {
                var getActive, setActive;
                if (attrs.active) {
                    getActive = $parse(attrs.active);
                    setActive = getActive.assign;
                    scope.$parent.$watch(getActive, function updateActive(value, oldVal) {
                        // Avoid re-initializing scope.active as it is already initialized
                        // below. (watcher is called async during init with value ===
                        // oldVal)
                        if (value !== oldVal) {
                            scope.active = !!value;
                        }
                    });
                    scope.active = getActive(scope.$parent);
                } else {
                    setActive = getActive = angular.noop;
                }

                scope.$watch('active', function (active) {
                    if (!angular.isFunction(setActive)) {
                        return;
                    }
                    // Note this watcher also initializes and assigns scope.active to the
                    // attrs.active expression.
                    setActive(scope.$parent, active);
                    if (active) {
                        tabsetCtrl.select(scope);
                        scope.onSelect();
                    } else {
                        scope.onDeselect();
                    }
                });

                scope.disabled = false;
                if (attrs.disabled) {
                    scope.$parent.$watch($parse(attrs.disabled), function (value) {
                        scope.disabled = !!value;
                    });
                }

                scope.select = function () {
                    if (!scope.disabled) {
                        scope.active = true;
                    }
                };

                tabsetCtrl.addTab(scope);
                scope.$on('$destroy', function () {
                    tabsetCtrl.removeTab(scope);
                });

                //We need to transclude later, once the content container is ready.
                //when this link happens, we're inside a tab heading.
                scope.$transcludeFn = transclude;
            };
        }
    };
}]).directive('tabHeadingTransclude', function () {
    'ngInject';

    return {
        restrict: 'A',
        require: '^tab',
        link: function link(scope, elm, attrs, tabCtrl) {
            scope.$watch('headingElement', function updateHeadingElement(heading) {
                if (heading) {
                    elm.html('');
                    elm.append(heading);
                }
            });
        }
    };
}).directive('tabContentTransclude', function () {
    'ngInject';

    return {
        restrict: 'A',
        require: '^tabset',
        link: function link(scope, elm, attrs) {
            var tab = scope.$eval(attrs.tabContentTransclude);

            //Now our tab is ready to be transcluded: both the tab heading area
            //and the tab content area are loaded.  Transclude 'em both.
            tab.$transcludeFn(tab.$parent, function (contents) {
                angular.forEach(contents, function (node) {
                    if (isTabHeading(node)) {
                        //Let tabHeadingTransclude know.
                        tab.headingElement = node;
                    } else {
                        elm.append(node);
                    }
                });
            });
        }
    };

    function isTabHeading(node) {
        return node.tagName && (node.hasAttribute('tab-heading') || node.hasAttribute('data-tab-heading') || node.tagName.toLowerCase() === 'tab-heading' || node.tagName.toLowerCase() === 'data-tab-heading');
    }
});

angular.module("mm.foundation", ["mm.foundation.accordion", "mm.foundation.alert", "mm.foundation.bindHtml", "mm.foundation.buttons", "mm.foundation.dropdownToggle", "mm.foundation.mediaQueries", "mm.foundation.modal", "mm.foundation.pagination", "mm.foundation.position", "mm.foundation.tabs"]);