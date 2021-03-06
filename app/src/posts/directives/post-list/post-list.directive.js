(function(){
  'use strict';

  angular.module('msp.posts')
    .directive('mspPostList', [
      '$timeout',
      'msp.posts.services',
      'msp.users.services',
      function($timeout, postServices, userServices) {
          return {
            templateUrl: viewTemplate,
            restrict: 'E',
            scope: true,
            link: init
          };

          function init(scope, element, attrs) {

            scope.getHowLongAgo = function(post) {
              if(!post._howLongAgo) {
                if(post.createdAt) {
                  post._howLongAgo = moment(post.createdAt).fromNow();
                }
                else {
                  post._howLongAgo = 'a lifetime ago';
                }
              }
              
              return post._howLongAgo;
            }

            scope.like = function(post) {
              postServices.like(post.id)
                .then(function() {
                  post.likes++;
                }, function() {
                  
                });
            }

            scope.comment = function(post) {
              userServices.loadCurrentUser().then(function(currentUser) {
                var comment = {
                  user: currentUser,
                  post: post.id,
                  content: scope.comment.content
                }

                postServices.comment(comment)
                  .then(function() {
                    var comments = post.comments || []
                    comments.push(comment);
                    post.comments = comments;
                    scope.comment.content = '';
                  }, function() {

                  });
              });
            }

            /**
             * Pass to scope
             * @type {Function}
             */
            scope.insertNewPost = insertNewPost;

            /**
             * Initialize with an empty list
             */
            setPosts([]);

            switch(attrs.type) {
              case 'timeline':
                scope.pageType = 'timeline';

                /**
                 * Load initial feeds
                 */
                postServices
                  .loadTimeline({username: attrs.user})
                  .then(setPosts);
                break;

              case 'feed':
              default:
                scope.pageType = 'feed';
                /**
                 * Load initial feeds
                 */
                postServices
                  .loadFeed()
                  .then(setPosts);

                /**
                 * Listen to the post service, update existing feed when a new post is created
                 */
                postServices.on('newpost', insertNewPost);

                break;
              
            }

            function setPosts(posts) {
              scope.feed = posts;
            }

            function insertNewPost(post) {
              /**
               * Cosmetic feature - highlight the new post for a short period
               * @type {Boolean}
               */
              post.isNew = true;
              $timeout(function() {
                post.isNew = false;
              }, 2000);

              /**
               * Add to the existing feed
               */
              scope.feed.unshift(post);
            }


            var loadingPosts = false;
            $(window).scroll(function() {
              if(!loadingPosts && $(document).height() - $(window).scrollTop() - $(window).height() < $(window).height() * 2) {
                console.log('loading new posts');
                loadingPosts = true;
                if(scope.pageType === 'feed') {
                  postServices
                    .loadFeed()
                    .then(function(posts) {
                      loadingPosts = false; 
                      _.each(posts, function(post) {
                        scope.feed.push(post);
                      });
                    });
                }
              }
            });
          }
        }
    ]);

  function viewTemplate() {
    return 'src/posts/directives/post-list/post-list.view.html';
  }

})();
