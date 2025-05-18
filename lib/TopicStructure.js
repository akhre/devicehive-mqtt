const CONST = require("../util/constants.json");
const LRU = require("lru-cache");
const cache = new LRU({
    max: 10000,
    ttl: 1000 * 60 * 60,
});

/**
 * TopicStructure class. Used to parse topic string
 */
class TopicStructure {
    /**
     * Create new topic structure
     * @param {string} topic
     */
    constructor(topic = ``) {
        this.response = false;
        this.request = false;
        this.domain = ``;
        this.action = ``;
        this.facility = ``;
        this.printer = ``;
        this.job = ``;
        this.name = ``;
        this.owner = ``;

        if (cache.has(topic)) {
            Object.assign(this, cache.get(topic));
        } else {
            if (topic && topic.startsWith(`${CONST.TOPICS.PARTS.DH}/`)) {
                const [topicBody, owner] = topic.split(
                    CONST.CLIENT_ID_TOPIC_SPLITTER
                );
                const partedTopicBody = topicBody.split(`/`);

                this.owner = owner;
                this.response =
                    partedTopicBody[1] === CONST.TOPICS.PARTS.RESPONSE;
                this.request =
                    partedTopicBody[1] === CONST.TOPICS.PARTS.REQUEST;

                const shift = this.response || this.request ? 1 : 0;
                const facility = partedTopicBody[2 + shift];
                const printer = partedTopicBody[3 + shift];
                const job = partedTopicBody[4 + shift];
                let name = partedTopicBody[5 + shift];

                name =
                    this.hasOwner() && name
                        ? name.split(CONST.CLIENT_ID_TOPIC_SPLITTER)[0]
                        : name;

                this.domain = partedTopicBody[0];
                this.action = partedTopicBody[1 + shift];
                this.facility =
                    !facility || CONST.MQTT.WILDCARDS.includes(facility)
                        ? ``
                        : facility;
                this.printer =
                    !printer || CONST.MQTT.WILDCARDS.includes(printer)
                        ? ``
                        : printer;
                this.job =
                    !job || CONST.MQTT.WILDCARDS.includes(job)
                        ? ``
                        : job;
                this.name =
                    !name || CONST.MQTT.WILDCARDS.includes(name) ? `` : name;

                cache.set(topic, this);
            }
        }
    }

    /**
     * Get topic domain
     * @return {string}
     */
    getDomain() {
        return this.domain;
    }

    /**
     * Check that topic has owner
     * @return {boolean}
     */
    hasOwner() {
        return !!this.owner;
    }

    /**
     * Get topic owner
     * @return {string}
     */
    getOwner() {
        return this.owner;
    }

    /**
     * Is subscription topic
     * @return {boolean}
     */
    isSubscription() {
        return !this.response && !this.request;
    }

    /**
     * Is response topic
     * @return {boolean}
     */
    isResponse() {
        return this.response;
    }

    /**
     * Is request topic
     * @return {boolean}
     */
    isRequest() {
        return this.request;
    }

    /**
     * Get topic action
     * @return {string}
     */
    getAction() {
        return this.action;
    }

    /**
     * Get topic facility
     * @return {Array}
     */
    getFacilityIds() {
        return !this.job && this.facility ? [this.facility] : undefined;
    }

    /**
     * Get topic printer
     * @return {Array}
     */
    getPrinterIds() {
        return !this.job && this.printer ? [this.printer] : undefined;
    }

    /**
     * Get topic job
     * @return {string}
     */
    getJob() {
        return this.job || undefined;
    }

    /**
     * Get topic Name
     * @return {Array}
     */
    getNames() {
        return this.name ? [this.name] : undefined;
    }

    /**
     * Is DeviceHive topic
     * @return {boolean}
     */
    isDH() {
        return this.domain === CONST.TOPICS.PARTS.DH;
    }

    /**
     * Is notification topic
     * @return {boolean}
     */
    isNotification() {
        return this.action === CONST.TOPICS.PARTS.NOTIFICATION;
    }

    /**
     * Is command topic
     * @return {boolean}
     */
    isCommandInsert() {
        return this.action === CONST.TOPICS.PARTS.COMMAND;
    }

    /**
     * Is command with update topic
     * @return {boolean}
     */
    isCommandUpdate() {
        return this.action === CONST.TOPICS.PARTS.COMMAND_UPDATE;
    }

    /**
     * TODO rework
     * Convert data object to topic
     * @param {Object} dataObject
     * @param {string} owner
     * @return {string}
     */
    static toTopicString(dataObject, owner = "") {
        let topicParts;

        if (dataObject.subscriptionId) {
            const action =
                dataObject.action === CONST.WS.ACTIONS.NOTIFICATION_INSERT
                    ? CONST.TOPICS.PARTS.NOTIFICATION
                    : dataObject.action === CONST.WS.ACTIONS.COMMAND_INSERT
                    ? CONST.TOPICS.PARTS.COMMAND
                    : CONST.TOPICS.PARTS.COMMAND_UPDATE;
            const propertyKey =
                dataObject.action === CONST.WS.ACTIONS.NOTIFICATION_INSERT
                    ? CONST.TOPICS.PARTS.NOTIFICATION
                    : CONST.TOPICS.PARTS.COMMAND;
            const facility = dataObject[propertyKey].facilityId;
            const printer = dataObject[propertyKey].printerId;
            const job = dataObject[propertyKey].jobId;
            const name = dataObject[propertyKey][propertyKey];

            topicParts = [
                CONST.TOPICS.PARTS.DH,
                action,
                facility,
                printer,
                job,
                name,
            ];
        } else {
            topicParts = [
                CONST.TOPICS.PARTS.DH,
                CONST.TOPICS.PARTS.RESPONSE,
                dataObject.action,
            ];
        }

        return owner
            ? `${topicParts.join("/")}${CONST.CLIENT_ID_TOPIC_SPLITTER}${owner}`
            : topicParts.join("/");
    }
}

module.exports = TopicStructure;
