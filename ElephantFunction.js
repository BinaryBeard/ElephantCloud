const AWS = require('aws-sdk')
const iotData = new AWS.IotData({ endpoint: 'a2638bvz51i7pu-ats.iot.us-east-1.amazonaws.com' })

exports.handler = async (event) => {
    switch (event.type) {
        case 'setup':
            return handleSetupEvent(event.screenCount, event.imageIDs, event.elephantName)
        case 'start':
            return handleStartEvent(event.testID, event.screenCount)
        case 'answer':
            return handleAnswerEvent(event.testID, event.screenCount, event.imageIDs, event.answerID)
        case 'stop':
            return handleStopEvent(event.testID, event.screenCount)
    }
}

function handleSetupEvent(screenCount, imageIDs, elephantName) {
    return new Promise((resolve, reject) => {
        if (screenCount !== imageIDs.length) {
            const resolution = {
                status: '400',
                timestamp: new Date().toISOString(),
                message: 'Screen count does not match imageIDs'
            }
            reject(resolution)
        }
        const testID = guid()

        shuffleArr(imageIDs)
        const promiseArr = []
        for (i = 0; i < screenCount; i++) {
            const payload = { testID, imageID: imageIDs[i], screens: imageIDs }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const resolution = createTestSetupRecord(testID, elephantName, screenCount, imageIDs)
                    resolution.statusCode = '200'
                    resolve(resolution)
                }
                else {
                    const resolution = {
                        status: '400',
                        timestamp: new Date().toISOString(),
                        message: 'Issue sending payload to screens'
                    }
                    reject(resolution)
                }
            })
            .catch((err) => {
                const resolution = {
                    status: '500',
                    timestamp: new Date().toISOString(),
                    message: err.message
                }
                reject(resolution)
            })
    })
}

function handleStartEvent(testID, screenCount) {
    return new Promise((resolve, reject) => {
        const promiseArr = []
        for (i = 0; i < screenCount; i++) {
            const payload = { ledState: 2, activateIR: true }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const resolution = createTestStartRecord(testID)
                    resolution.statusCode = '200'
                    resolve(resolution)
                }
                else {
                    const resolution = {
                        status: '400',
                        timestamp: new Date().toISOString(),
                        message: 'Issue sending payload to screens'
                    }
                    reject(resolution)
                }
            })
            .catch((err) => {
                const resolution = {
                    status: '500',
                    timestamp: new Date().toISOString(),
                    message: err.message
                }
                reject(resolution)
            })
    })
}

function handleAnswerEvent(testID, screenCount, imageIDs, answerInt) {
    return new Promise((resolve, reject) => {
        const promiseArr = []
        for (i = 0; i < screenCount; i++) {
            const payload = { ledState: (answerInt === i + 1) ? 1 : 0, activateIR: false, screens: [] }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const resolution = createAnswerSetRecord(testID, imageIDs, answerInt)
                    resolution.statusCode = '200'
                    resolve(resolution)
                }
                else {
                    const resolution = {
                        status: '400',
                        timestamp: new Date().toISOString(),
                        message: 'Issue sending payload to screens'
                    }
                    reject(resolution)
                }
            })
            .catch((err) => {
                const resolution = {
                    status: '500',
                    timestamp: new Date().toISOString(),
                    message: err.message
                }
                reject(resolution)
            })
    })
}

function handleStopEvent(testID, screenCount) {
    return new Promise((resolve, reject) => {
        const promiseArr = []
        for (i = 0; i < screenCount; i++) {
            const payload = {
                testID: '',
                imageID: 0,
                activateIR: false,
                ledState: 0,
                feederDuration: 0,
                screens: [],
            }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const resolution = createStopRecord(testID)
                    resolution.statusCode = '200'
                    resolve(resolution)
                }
                else {
                    const resolution = {
                        status: '400',
                        timestamp: new Date().toISOString(),
                        message: 'Issue sending payload to screens'
                    }
                    reject(resolution)
                }
            })
            .catch((err) => {
                const resolution = {
                    status: '500',
                    timestamp: new Date().toISOString(),
                    message: err.message
                }
                reject(resolution)
            })
    })
}

function shuffleArr(array) {
    let currentIndex = array.length, temporaryValue, randomIndex
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
}

function sendPayloadToThing(thingName, desired) {
    const params = {
        thingName: thingName,
        payload: JSON.stringify({ state: { desired } })
    }
    return iotData.updateThingShadow(params).promise()
        .then((data) => {
            return true
        })
        .catch((err) => {
            return false
        })
}

function createTestSetupRecord(testID, elephantName, screenCount, imageIDs) {
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        elephant_name: elephantName,
        screen_count: screenCount,
        image_references: imageIDs,
        type: 'setup'
    }

    console.log('STORING TEST SETUP RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function createTestStartRecord(testID) {
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        type: 'start'
    }

    console.log('STORING TEST START RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function createAnswerSetRecord(testID, imageIDs, selectedInt) {
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        type: 'answer',
        screens: []
    }

    for (i = 0; i < 3; i++) {
        const screenData = {
            id: i + 1,
            image: imageIDs[i],
            selected: i + 1 === selectedInt
        }
        dataToStore.screens.push(screenData)
    }

    console.log('STORING ANSWER RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function createStopRecord(testID) {
    const isoDate = new Date().toISOString()
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        type: 'stop'
    }
    console.log('STORING TEST END RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    }
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}
