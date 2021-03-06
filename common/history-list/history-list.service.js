/**
 * @param $cookies
 */
export default function ($cookies) {
  'ngInject';
  const me = this;
  /**
   * items is a dictionary/cache of various history lists.
   * It is populated from history.directive by readSourceHistory function
   * and then appended by addSourceHistory function
   */
  me.items = {};

  me.readSourceHistory = function (forWhat) {
    const sourceString = $cookies.get(`last${forWhat}Sources`);
    if (angular.isDefined(sourceString)) {
      me.items[forWhat] = uniq(angular.fromJson(sourceString));
    } else {
      me.items[forWhat] = [];
    }
    return me.items[forWhat];
  };

  /**
   * @param a
   */
  function uniq(a) {
    return a.sort().filter((item, pos, ary) => {
      return !pos || item != ary[pos - 1];
    });
  }

  me.addSourceHistory = function (forWhat, url) {
    if (angular.isUndefined(me.items[forWhat])) {
      me.items[forWhat] = [];
    }
    if (me.items[forWhat].indexOf(url) == -1) {
      me.items[forWhat].push(url);
      $cookies.put(`last${forWhat}Sources`, angular.toJson(me.items[forWhat]));
    }
  };

  return me;
}
