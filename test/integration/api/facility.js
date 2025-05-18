const CONST = require(`../constants.json`);
const Config = require(`../../config`).test.integration;
const mqtt = require(`mqtt`);
const EventEmitter = require("events");
const randomString = require(`randomstring`);
const chai = require(`chai`);
const expect = chai.expect;

const ee = new EventEmitter();

const SUBJECT = `facility`;
const GET_OPERATION = `get`;
const LIST_OPERATION = `list`;
const INSERT_OPERATION = `insert`;
const UPDATE_OPERATION = `update`;
const DELETE_OPERATION = `delete`;
const GET_ACTION = `${SUBJECT}/${GET_OPERATION}`;
const LIST_ACTION = `${SUBJECT}/${LIST_OPERATION}`;
const INSERT_ACTION = `${SUBJECT}/${INSERT_OPERATION}`;
const UPDATE_ACTION = `${SUBJECT}/${UPDATE_OPERATION}`;
const DELETE_ACTION = `${SUBJECT}/${DELETE_OPERATION}`;
const GET_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${GET_ACTION}`;
const LIST_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${LIST_ACTION}`;
const INSERT_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${INSERT_ACTION}`;
const UPDATE_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${UPDATE_ACTION}`;
const DELETE_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${DELETE_ACTION}`;
const TEST_FACILITY_NAME = randomString.generate();
const TEST_FACILITY_DESCRIPTION = randomString.generate();
const UPDATED_TEST_FACILITY_DESCRIPTION = randomString.generate();
let mqttClient;
let testFacilityId;

it(`should connect to MQTT broker`, () => {
    return new Promise((resolve) => {
        mqttClient = mqtt.connect(Config.MQTT_BROKER_URL, {
            username: Config.TEST_LOGIN,
            password: Config.TEST_PASSWORD,
        });

        mqttClient.on(`message`, (topic, message) => {
            const messageObject = JSON.parse(message.toString());

            ee.emit(messageObject.requestId, messageObject);
        });

        mqttClient.on("connect", () => {
            resolve();
        });
    });
});

it(`should subscribe for "${GET_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        mqttClient.subscribe(
            `${GET_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
});

it(`should subscribe for "${LIST_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        mqttClient.subscribe(
            `${LIST_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
});

it(`should subscribe for "${INSERT_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        mqttClient.subscribe(
            `${INSERT_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
});

it(`should subscribe for "${UPDATE_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        mqttClient.subscribe(
            `${UPDATE_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
});

it(`should subscribe for "${DELETE_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        mqttClient.subscribe(
            `${DELETE_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
});

it(`should create new facility with name: "${TEST_FACILITY_NAME}" and description: "${TEST_FACILITY_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.facility).to.be.an(`object`);

            testFacilityId = message.facility.id;

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: INSERT_ACTION,
                requestId: requestId,
                facility: {
                    name: TEST_FACILITY_NAME,
                    description: TEST_FACILITY_DESCRIPTION,
                },
            })
        );
    });
});

it(`should query the facility name: "${TEST_FACILITY_NAME} and description: "${TEST_FACILITY_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.facility).to.be.an(`object`);
            expect(message.facility.id).to.equal(testFacilityId);
            expect(message.facility.name).to.equal(TEST_FACILITY_NAME);
            expect(message.facility.description).to.equal(
                TEST_FACILITY_DESCRIPTION
            );

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: GET_ACTION,
                requestId: requestId,
                facilityId: testFacilityId,
            })
        );
    });
});

it(`should query the list of facilities with existing facility name: "${TEST_FACILITY_NAME} and description: "${TEST_FACILITY_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.facilities).to.be.an(`array`);
            expect(
                message.facilities.map((facilityObject) => facilityObject.id)
            ).to.include.members([testFacilityId]);
            expect(
                message.facilities.map((facilityObject) => facilityObject.name)
            ).to.include.members([TEST_FACILITY_NAME]);
            expect(
                message.facilities.map(
                    (facilityObject) => facilityObject.description
                )
            ).to.include.members([TEST_FACILITY_DESCRIPTION]);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: LIST_ACTION,
                requestId: requestId,
                take: 10,
            })
        );
    });
});

it(`should update the facility description: "${TEST_FACILITY_DESCRIPTION}" to "${UPDATED_TEST_FACILITY_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: UPDATE_ACTION,
                requestId: requestId,
                facilityId: testFacilityId,
                facility: {
                    description: UPDATED_TEST_FACILITY_DESCRIPTION,
                },
            })
        );
    });
});

it(`should query the updated facility where updated description is: "${UPDATED_TEST_FACILITY_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.facility).to.be.an(`object`);
            expect(message.facility.id).to.equal(testFacilityId);
            expect(message.facility.name).to.equal(TEST_FACILITY_NAME);
            expect(message.facility.description).to.equal(
                UPDATED_TEST_FACILITY_DESCRIPTION
            );

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: GET_ACTION,
                requestId: requestId,
                facilityId: testFacilityId,
            })
        );
    });
});

it(`should delete the facility"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: DELETE_ACTION,
                requestId: requestId,
                facilityId: testFacilityId,
            })
        );
    });
});

it(`should query the list of the facilities without deleted facility`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.facilities).to.be.an(`array`);
            expect(
                message.facilities.map((facilityObject) => facilityObject.id)
            ).to.not.include.members([testFacilityId]);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: LIST_ACTION,
                requestId: requestId,
                facilityId: Config.FACILITY_ID,
            })
        );
    });
});

it(`should disconnect from MQTT broker`, () => {
    return new Promise((resolve) => {
        mqttClient.end(() => {
            resolve();
        });
    });
});
