// Scramjet bundle
(function (self) {
    const config = self.__scramjet$config;

    // Make sure the config exists
    if (!config) {
        throw new Error("Scramjet config not found");
    }

    // Scramjet handler
    class Scramjet {
        constructor(config) {
            this.config = config;
        }

        encodeUrl(url) {
            return this.config.encodeUrl(url);
        }

        decodeUrl(url) {
            return this.config.decodeUrl(url);
        }

        getOriginalUrl(url) {
            if (url.startsWith(this.config.prefix)) {
                return this.config.decodeUrl(url.slice(this.config.prefix.length));
            }
            return url;
        }
    }

    // Create the scramjet instance
    self.__scramjet = new Scramjet(config);
})(self);