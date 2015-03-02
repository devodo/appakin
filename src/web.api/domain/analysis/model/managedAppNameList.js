'use strict';

var managedAppName = require('./managedAppName');

function ManagedAppNameList(managedAppNames) {
    this.managedAppNames = managedAppNames;
}

ManagedAppNameList.prototype.matches = function(sentence) {
    for (var i = 0; i < this.managedAppNames.length; ++i) {
        if (this.managedAppNames[i].matches(sentence)) {
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
        }
    }

    return new ManagedAppNameList(relatedManagedAppNames);
}

exports.createManagedAppNameList = createManagedAppNameList;
