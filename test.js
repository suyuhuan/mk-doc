// const qiniu = require('qiniu')
const QiniuManager = require('./src/utils/QiniuManager')

var accessKey = '4o1z0xoryUF155q255RW957QIUlWsf_QUy6c0NfC';
var secretKey = '3G6Ps6Ps6PTfu385HbWl0U-5U6uWlcHOH9YVFEvl';
// var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

// var options = {
//     scope: 'mk-doc',
//   };

// var putPolicy = new qiniu.rs.PutPolicy(options);
// var uploadToken=putPolicy.uploadToken(mac);

// var config = new qiniu.conf.Config();
// 空间对应的机房
// config.zone = qiniu.zone.Zone_z0;

var localFile = "/Users/suyuhuan/Desktop/mk2.md";
// var formUploader = new qiniu.form_up.FormUploader(config);
// var putExtra = new qiniu.form_up.PutExtra();
var key='mk2.md';
const manage = new QiniuManager(accessKey,secretKey,'mk-doc')
// manage.uploadFile(key, localFile)
manage.deleteFile(key)
// 文件上传
// formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr,
//   respBody, respInfo) {
//   if (respErr) {
//     throw respErr;
//   }

//   if (respInfo.statusCode == 200) {
//     console.log(respBody);
//   } else {
//     console.log(respInfo.statusCode);
//     console.log(respBody);
//   }
// });

// var bucketManager = new qiniu.rs.BucketManager(mac, config);
// var publicBucketDomain = 'ql9zo7mr8.hd-bkt.clouddn.com';

// 公开空间访问链接
// var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
// console.log(publicDownloadUrl);




  