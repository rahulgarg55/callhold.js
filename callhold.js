const pbx_logger = require('../logger/pbx_logger.js');
const ari = require('ari-client');
const { validateSessionId } = require('../validator/holdvalidator.js');
const cfg = require('../pbx_config');
const logger = new pbx_logger();
const Event = require('../fsm/events.js');
var pline = new Object();

let call;

function CustomerHold(call_obj) {
  call = call_obj;
}

function hold_this_call() {
  console.log("3333333")
  logger.log('IMP', call.channel.id, 'agent_transfer_web', 'Internal Function [hold_this_call]');
  console.log("44444")
  if (call.transHoldFlag === "0") {
    logger.log('DEB', call.channel.id, 'agent_transfer_web', "[hold_call_reminder] timer initialize..");
    // call.objReminderCallHoldToAgent = setTimeout(hold_call_reminder, (cfg.timer.call_hold_reminder_to_agent_timer * 1000));

    if (call.transferLegState !== "connected") {
      call.transferLeg = call.dialedLeg;
    }

    call.transferLeg.snoopChannel({
      app: cfg.asterisk.stasisApp,
      channelId: call.transferLeg.id,
      spy: 'out',
      whisper: 'out',
      appArgs: 'SNOOPING_NOTIFY_AGENT_CUST_CALL_ON_HOLD'
    }, function (err, channel) {
      if (err) {
        logger.log('ERR', call.channel.id, 'agent_transfer_web', "error in snoopChannel: " + err);
      } else {
        logger.log('DEB', call.channel.id, 'agent_transfer_web', "Channel snoopChannel on(" + call.transferLeg.id + ")");
      }
    });

    if (call.dbMusicOnHoldPrompt !== "0") {
      logger.log('DEB', call.channel.id, 'agent_transfer_web', "Hold (custom) class " + call.smeID + "");
      call.startMohClass = call.smeID;
    } else {
      call.startMohClass = "Default";
      logger.log('DEB', call.channel.id, 'agent_transfer_web', "Hold (default) class");
    }

    call.client.channels.startMoh({
      channelId: call.channel.id,
      mohClass: call.startMohClass
    }, function (err) {
      if (err) {
        logger.log('ERR', call.channel.id, 'agent_transfer_web', "[" + this.state_name + "]: error while HOLD customer: " + err);
      } else {
        logger.log('DEB', call.channel.id, 'agent_transfer_web', "Customer ON HOLD now...");
        call.transHoldFlag = "1";
      }
    });
  } else {
    logger.log('DEB', call.channel.id, 'agent_transfer_web', "customer already on hold");
  }
}


const holdAction = (req, res) => {
  //console.log("Received call:", call); 
  console.log("webTransferEventType:", call?.webTransferEventType);

  try {
    const reqdData = req.body


    logger.log('IMP', reqdData.session_id, 'main', "[HOLD]");
    logger.log('DEB', reqdData.session_id, 'main', "Perform a HOLD...");

    //if (validateSessionId(reqdData)) {
    logger.log('Validation successful for session ID:', reqdData.session_id);
    console.log("222222")
    // pline[reqdData.session_id].webTransferEventType = "HOLD";

    //    if (call.webTransferEventType === "HOLD") { 
    console.log("!111111")
    hold_this_call();
    //    }

    let response = {
      "status": 1,
      "mode": "IVR",
      "message": "Hold initiated!"
    };

    res.end(JSON.stringify(response));
    //} else {
    //   logger.log('Validation failed for session ID:', reqdData.session_id);
    //   res.status(403).send('Invalid session ID');
    // }

  } catch (error) {
    logger.log('Error occurred during request processing:', error);
    res.status(500).send('Internal Server Error');
  }

};

module.exports = {
  CustomerHold,
  holdAction,
  hold_this_call
}
