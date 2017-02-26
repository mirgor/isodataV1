var gulp = require('gulp');
var server = require('gulp-server-livereload');
var php = require('gulp-connect-php');

gulp.task('webserver', ['php-api'], function () {
    gulp.src('./')
        .pipe(server({
            livereload: {
                enable: true,
                filter: function (filePath, cb) {
                    cb(!(/node_modules/.test(filePath)) && !(/api/.test(filePath)));
                }
            },
            defaultFile: 'index.html',
            fallback: 'index.html',
            open: true
        }));
});

gulp.task('php-api', function () {
    php.server({
        port: 8088,
        keepalive: true
    });
});