'use strict';

var managedAppName = require('./managedAppName');
var log = require('../../../logger');

function ManagedAppNameList(managedAppNames, developerName) {
    this.managedAppNames = managedAppNames;
    this.developerName = developerName;
    log.warn('managed app names count: ' + this.managedAppNames.length);
}

ManagedAppNameList.prototype.matches = function(sentence, matchOnWholeSentence) {
    for (var i = 0; i < this.managedAppNames.length; ++i) {
        if (this.managedAppNames[i].matches(sentence, matchOnWholeSentence)) {
            return true;
        }
    }

    return false;
};

function createManagedAppNameList(appName, developerName, relatedAppNames) {
    relatedAppNames = relatedAppNames || [];
    var appNameResult = managedAppName.createManagedAppName(appName, developerName);
    var relatedManagedAppNames = [];

    for (var i = 0; i < relatedAppNames.length; ++i) {
        var relatedAppName = relatedAppNames[i];
        var relatedManagedAppName = managedAppName.createManagedAppName(relatedAppName, developerName);

        if (!relatedManagedAppName.isSimilarTo(appNameResult)) {
            // Only include related app names that are sufficiently different to appname.
            relatedManagedAppNames.push(relatedManagedAppName);
        } else {
            log.warn('ignoring app name ['+ relatedAppName + '] compared to [' + appName + ']');
        }
    }

    log.warn('RELATED APP NAMES' + relatedAppNames.join('==='));
    log.warn('RELATED MANAGED APP NAMES' + relatedManagedAppNames.map(function(x) {return x.originalAppName}).join('==='));

    return new ManagedAppNameList(relatedManagedAppNames, developerName);
}

exports.createManagedAppNameList = createManagedAppNameList;
