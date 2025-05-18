const CONST = require(`../constants.json`);
const Config = require(`../../config`).test.integration;
const mqtt = require(`mqtt`);
const EventEmitter = require("events");
const randomString = require(`randomstring`);
const chai = require(`chai`);
const expect = chai.expect;

const ee = new EventEmitter();

const SUBJECT = `job`;
const GET_OPERATION = `get`;
const LIST_OPERATION = `list`;
const SAVE_OPERATION = `save`;
const DELETE_OPERATION = `delete`;
const GET_ACTION = `${SUBJECT}/${GET_OPERATION}`;
const LIST_ACTION = `${SUBJECT}/${LIST_OPERATION}`;
const SAVE_ACTION = `${SUBJECT}/${SAVE_OPERATION}`;
const DELETE_ACTION = `${SUBJECT}/${DELETE_OPERATION}`;
const GET_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${GET_ACTION}`;
const LIST_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${LIST_ACTION}`;
const SAVE_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${SAVE_ACTION}`;
const DELETE_TOPIC = `${CONST.DH_RESPONSE_TOPIC}/${DELETE_ACTION}`;
const JOB_1_ID = randomString.generate();
const JOB_2_ID = randomString.generate();
const JOB_1_NAME = randomString.generate();
const JOB_2_NAME = randomString.generate();
const JOB_1_NAME_UPDATED = randomString.generate();
let mqttClient;

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

it(`should subscribe for "${SAVE_TOPIC}" topic`, () => {
    return new Promise((resolve, reject) => {
        mqttClient.subscribe(
            `${SAVE_TOPIC}@${mqttClient.options.clientId}`,
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

it(`should create new job (1) with ID: "${JOB_1_ID}" and name: "${JOB_1_NAME}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: SAVE_ACTION,
                requestId: requestId,
                jobId: JOB_1_ID,
                job: {
                    name: JOB_1_NAME,
                    data: {},
                    facilityId: Config.FACILITY_ID,
                },
            })
        );
    });
});

it(`should create new job (2) with ID: "${JOB_2_ID}" and name: "${JOB_2_NAME}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: SAVE_ACTION,
                requestId: requestId,
                jobId: JOB_2_ID,
                job: {
                    name: JOB_2_NAME,
                    data: {},
                    facilityId: Config.FACILITY_ID,
                },
            })
        );
    });
});

it(`should query the job (1) with ID: "${JOB_1_ID}" and name: "${JOB_1_NAME}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.job).to.be.an(`object`);
            expect(message.job.id).to.equal(JOB_1_ID);
            expect(message.job.name).to.equal(JOB_1_NAME);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: GET_ACTION,
                requestId: requestId,
                jobId: JOB_1_ID,
            })
        );
    });
});

it(`should query the job (2) with ID: "${JOB_2_ID}" and name: "${JOB_2_NAME}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.job).to.be.an(`object`);
            expect(message.job.id).to.equal(JOB_2_ID);
            expect(message.job.name).to.equal(JOB_2_NAME);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: GET_ACTION,
                requestId: requestId,
                jobId: JOB_2_ID,
            })
        );
    });
});

it(`should query the list of jobs with existing job (1) and job (2)`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(
                message.jobs.map((jobObject) => jobObject.id)
            ).to.include.members([JOB_1_ID, JOB_2_ID]);
            expect(
                message.jobs.map((jobObject) => jobObject.name)
            ).to.include.members([JOB_1_NAME, JOB_2_NAME]);

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

it(`should update the job (1) name: "${JOB_1_NAME}" to "${JOB_1_NAME_UPDATED}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: SAVE_ACTION,
                requestId: requestId,
                jobId: JOB_1_ID,
                job: {
                    name: JOB_1_NAME_UPDATED,
                    data: {},
                    facilityId: Config.FACILITY_ID,
                },
            })
        );
    });
});

it(`should query the updated job (1) with ID: "${JOB_2_ID}" and updated name: "${JOB_1_NAME_UPDATED}"`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(message.job).to.be.an(`object`);
            expect(message.job.id).to.equal(JOB_1_ID);
            expect(message.job.name).to.equal(JOB_1_NAME_UPDATED);

            resolve();
        });

        mqttClient.publish(
            CONST.DH_REQUEST_TOPIC,
            JSON.stringify({
                action: GET_ACTION,
                requestId: requestId,
                jobId: JOB_1_ID,
            })
        );
    });
});

it(`should delete job (1) with ID: "${JOB_1_ID}"`, () => {
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
                jobId: JOB_1_ID,
            })
        );
    });
});

it(`should delete job (2) with ID: "${JOB_2_ID}"`, () => {
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
                jobId: JOB_2_ID,
            })
        );
    });
});

it(`should query the list of jobs without job (1) and job (2)`, () => {
    const requestId = randomString.generate();

    return new Promise((resolve) => {
        ee.once(requestId, (message) => {
            expect(message.status).to.equal(CONST.SUCCESS_STATUS);
            expect(
                message.jobs.map((jobObject) => jobObject.id)
            ).to.not.include.members([JOB_1_ID, JOB_2_ID]);

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
