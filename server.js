const AWS = require('aws-sdk');
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
AWS.config.loadFromPath('./cred.json');
const kinesis = new AWS.Kinesis({ region: 'ap-south-1' });

async function readFromAllShards(streamName) {
  const shardIds = await getShardIds(streamName);
  console.log("Reading")
  const promises = shardIds.map(async (shardId) => {
    let nextShardIterator = await getShardIterator(streamName, shardId);

    while (true) {
      const records = await kinesis.getRecords({
        ShardIterator: nextShardIterator,
        Limit: 400
      }).promise();

      console.log("Reading....",records)
      if (records.Records.length === 0) {
        //break;
        continue;
      }

      console.log(records.Records);

      nextShardIterator = records.NextShardIterator;
    }
  });

  await Promise.all(promises);
}

async function getShardIds(streamName) {
  const data = await kinesis.describeStream({ StreamName: streamName }).promise();
  const shardIds = data.StreamDescription.Shards.map(shard => shard.ShardId);
  return shardIds;
}

// async function getShardIterator(streamName, shardId) {
//   const shardIterator = await kinesis.getShardIterator({
//     ShardId: shardId,
//     ShardIteratorType: 'AT_SEQUENCE_NUMBER',
//     StartingSequenceNumber: '49647189082606277275268354744764265697417394776914788354',
//     StreamName: streamName
//   }).promise();

//   return shardIterator.ShardIterator;
// }

async function getShardIterator(streamName, shardId) {
  const shardIterator = await kinesis.getShardIterator({
    ShardId: shardId,
    ShardIteratorType: 'AT_TIMESTAMP',
    StreamName: streamName,
    Timestamp: 1703107102
  }).promise();

  return shardIterator.ShardIterator;
}

readFromAllShards("hiq_stream")
