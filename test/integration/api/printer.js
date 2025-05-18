const CONST = require(`../constants.json`);
const Config = require(`../../config`).test.integration;
const mqtt = require(`mqtt`);
const EventEmitter = require("events");
const randomString = require(`randomstring`);
const chai = require(`chai`);
const expect = chai.expect;

const ee = new EventEmitter();

const SUBJECT = `printer`;
const LIST_OPERATION = `list`;
const COUNT_OPERATION = `count`;
const GET_OPERATION = `get`;
const INSERT_OPERATION = `insert`;
const UPDATE_OPERATION = `update`;
const DELETE_OPERATION = `delete`;
const LIST_ACTION = `${SUBJECT}/${LIST_OPERATION}`;
const COUNT_ACTION = `${SUBJECT}/${COUNT_OPERATION}`;
const GET_ACTION = `${SUBJECT}/${GET_OPERATION}`;
const INSERT_ACTION = `${SUBJECT}/${INSERT_OPERATION}`;
const UPDATE_ACTION = `${SUBJECT}/${UPDATE_OPERATION}`;
const DELETE_ACTION = `${SUBJECT}/${DELETE_OPERATION}`;
const LIST_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${LIST_ACTION}`;
const COUNT_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${COUNT_ACTION}`;
const GET_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${GET_ACTION}`;
const INSERT_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${INSERT_ACTION}`;
const UPDATE_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${UPDATE_ACTION}`;
const DELETE_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${DELETE_ACTION}`;
const TEST_PRINTER_NAME = randomString.generate();
const TEST_PRINTER_DESCRIPTION = randomString.generate();
const TEST_PRINTER_NEW_DESCRIPTION = randomString.generate();
let printerCount = 0;
let mqttClient;
let customPrinterId;

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

it(`should subscribe for "${LIST_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        return mqttClient.subscribe(
            `${LIST_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                return err ? reject(err) : resolve();
            }
        );
    });
});

it(`should subscribe for "${COUNT_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        return mqttClient.subscribe(
            `${COUNT_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                return err ? reject(err) : resolve();
            }
        );
    });
});

it(`should subscribe for "${GET_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        return mqttClient.subscribe(
            `${GET_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                return err ? reject(err) : resolve();
            }
        );
    });
});

it(`should subscribe for "${INSERT_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        return mqttClient.subscribe(
            `${INSERT_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                return err ? reject(err) : resolve();
            }
        );
    });
});

it(`should subscribe for "${UPDATE_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        return mqttClient.subscribe(
            `${UPDATE_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                return err ? reject(err) : resolve();
            }
        );
    });
});

it(`should subscribe for "${DELETE_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        return mqttClient.subscribe(
            `${DELETE_TOPIC}@${mqttClient.options.clientId}`,
            (err) => {
                return err ? reject(err) : resolve();
            }
        );
    });
});

it(`should get count of existing printers`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.count).to.be.a(`number`);
            printerCount = message.count;
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: COUNT_ACTION,
                requestId: requestId,
            })
        );
    });
});

it(`should create new printer with name: "${TEST_PRINTER_NAME}" and description: "${TEST_PRINTER_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.printer.id).to.be.a(`number`);
            customPrinterId = message.printer.id;
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: INSERT_ACTION,
                requestId: requestId,
                printer: {
                    name: TEST_PRINTER_NAME,
                    description: TEST_PRINTER_DESCRIPTION,
                },
            })
        );
    });
});

it(`should get new count of existing printers increased by 1`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.count).to.be.a(`number`);
            expect(message.count).to.equal(printerCount + 1);
            printerCount = message.count;
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: COUNT_ACTION,
                requestId: requestId,
            })
        );
    });
});

it(`should query the printer with name: "${TEST_PRINTER_NAME}" and description: "${TEST_PRINTER_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.printers).to.be.an(`array`);
            expect(message.printers[0].id).to.equal(customPrinterId);
            expect(message.printers[0].name).to.equal(TEST_PRINTER_NAME);
            expect(message.printers[0].description).to.equal(
                TEST_PRINTER_DESCRIPTION
            );
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: LIST_ACTION,
                requestId: requestId,
                name: TEST_PRINTER_NAME,
            })
        );
    });
});

it(`should update printer with name: "${TEST_PRINTER_NAME}" to new description: "${TEST_PRINTER_NEW_DESCRIPTION}"`, () => {
    const requestId1 = randomString.generate();
    const requestId2 = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId1, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);

            mqttClient.publish(
                CONST.DH_REQUEST_TOPIC,
                JSON.stringify({
                    action: GET_ACTION,
                    requestId: requestId2,
                    printerId: customPrinterId,
                })
            );
        });

        ee.once(requestId2, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.printer).to.be.an(`object`);
            expect(message.printer.id).to.equal(customPrinterId);
            expect(message.printer.name).to.equal(TEST_PRINTER_NAME);
            expect(message.printer.description).to.equal(
                TEST_PRINTER_NEW_DESCRIPTION
            );
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: UPDATE_ACTION,
                requestId: requestId1,
                printerId: customPrinterId,
                printer: {
                    name: TEST_PRINTER_NAME,
                    description: TEST_PRINTER_NEW_DESCRIPTION,
                },
            })
        );
    });
});

it(`should delete the printer with name: "${TEST_PRINTER_NAME}" and description: "${TEST_PRINTER_NEW_DESCRIPTION}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: GET_ACTION,
                requestId: requestId,
                printerId: customPrinterId,
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
