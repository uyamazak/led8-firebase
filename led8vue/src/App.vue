<template>
<div>
  <div>
  <b-navbar variant="faded" type="light">
    <b-navbar-brand tag="h1" class="mb-0">LED8</b-navbar-brand>
    <b-navbar-nav v-if="$firebase.isAuthenticated" class="ml-auto">
      <b-nav-item>ID: {{ shortenUid($firebase.user.uid) }} </b-nav-item>
      <b-button v-on:click='$firebase.signOut()' variant="outline-secondary">Sign Out</b-button>
    </b-navbar-nav>
    <b-navbar-nav v-else>
      <b-button v-on:click='$firebase.signInGoogle()' variant="success">Sign in</b-button>
    </b-navbar-nav>
  </b-navbar>
  </div>
  <div class="bg-dark text-light pb-3">
    <div class="container">
      <div class="pt-4">
        <div v-if='recentPhotoLog.url'>
          <div class="text-center"><b-spinner v-if='isLoadingPhoto' type="grow" label="Loading..."></b-spinner></div>
          <b-img :src='recentPhotoLog.url' fluid :alt="'LED8 photo at ' + formatDate(recentPhotoLog.timestamp)"></b-img>
        </div>
        <div>{{ formatDate(recentPhotoLog.timestamp) }}</div>
        <div>{{ recentPhotoLog.status }}</div>
      </div>

      <div class="pt-4">
        <div v-if='!$firebase.isAuthenticated'>
          <b-alert show>
          To send commands <b-button v-on:click='$firebase.signInGoogle()' variant="link">Sign in</b-button> required.
          </b-alert>
        </div>
        <div class="row">
          <div v-for="item in LEDConfig" :key="item.key" class="col-3 col-lg-1 text-center pt-2">
            <b-form-checkbox size="lg" v-model="LEDStatus" name="check-button" :disabled="!isCommandAvailable" :value="item.key" :button-variant="item.color" button>{{ item.key }}</b-form-checkbox>
          </div>
        </div>
      </div>

      <div class="row pt-3">
        <div class="col col-lg-4">
          <b-button variant="primary" block @click="onAllLEDs()" :disabled="!isCommandAvailable">On All</b-button>
        </div>
        <div class="col col-lg-4">
          <b-button variant="outline-secondary" block @click="offAllLEDs()" :disabled="!isCommandAvailable">Off All</b-button>
        </div>
      </div>

      <div v-if='!isSameAsLatastStatus' class="mt-4 text-center" role="group">
        <b-button variant="success" @click="loadRecentLEDStatus" :disabled="!isCommandAvailable">Load Recent Status</b-button>
      </div>

      <div class="text-center"><b-spinner v-if="isSendingCommand" type="grow" label="Sending..."></b-spinner></div>

      <div class="table-responsive pt-4">
        <table class="table table-dark table-sm">
          <tr>
            <th>Datetime</th>
            <th>Status</th>
            <th>User</th>
          </tr>
          <tr v-for="(log, index) in LEDCommandLog" :key="index">
            <td><small>{{ formatDate(log.timestamp) }}</small></td>
            <td>{{ log.status }}</td>
            <td>{{ formatUid(log.uid) }}</td>
          </tr>
        </table>
      </div>
      <div class="jumbotron text-dark mt-5">
        <h1>LED8について</h1>
        <p>埼玉県某所にあるuyamazak自宅のテレビ台内に設置された8個のLEDを光らせたり、消したりできるWEBサービスです。</p>
        <p>実際どう光っているかは表示される写真で確認できます。実際の点灯は数秒、写真の反映は回線によりますが設定変更後10数秒程度で撮影＆読み込みされます。</p>
        <h2>使っている技術・もの</h2>
        <ul>
          <li><a href="https://amzn.to/32YKv0T">Raspberry Pi Zero WH</a></li>
          <li><a href="https://amzn.to/32UDJJF">ラズパイ用カメラ</a></li>
          <li>電子部品（LED、ブレッドボード、1kΩ抵抗、ブレッドボード、ジャンパーワイヤ）</li>
          <li>ダンボール・養生テープ(土台、パーツ固定に)</li>
          <li>家にあったデジタル電波時計</li>
          <li>Python3 (Raspberry Pi上のプログラム。<a href="https://github.com/uyamazak/led8-raspi">GitHub</a>)</li>
          <li>JavaSscript, Vue.js, Vue CLI (FirebaseWEBアプリ。<a href="https://github.com/uyamazak/led8-firebase">GitHub</a>)</li>
          <li>データベース: Firestore (us-central)</li>
          <li>ホスティング: Firebase Hosting</li>
          <li>ファイルストレージ（写真用）: Firebase Storage</li>
          <li>開発環境： Google Pixelbook。ラズパイ上のvim。Google Cloud Shell, VS Code</li>
        </ul>
        <p>問い合わせはuyamazakまで。<a href="https://twitter.com/uyamazak">Twitter</a> / <a href="https://github.com/uyamazak">GitHub</a> / <a href="https://uyamazak.hatenablog.com/">Blog</a></p>

        <h3>利用規約的なもの</h3>
        <p>無料です。</p>
        <p>我が家のLEDを光らせる以上の意味はないので本人と身内しか使わない想定ですが、誰でもGoogleアカウントでログインすれば、LEDのオンオフ操作を行えます。</p>
        <p>Google認証は不正利用防止のためですので、特にそういった問題の対処以外にはメールアドレスなどの情報は利用しません。サービス終了時はデータ抹消します。</p>
        <p>メンテナンスや、機器の故障、月のサーバー費用が1000円を超えたり家庭の問題が起きた場合は予告なく停止したり、終了します。</p>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import debounce from 'lodash/debounce'
const LED_CONFIG = [
  { key: 8, color: 'outline-light' },
  { key: 7, color: 'outline-warning' },
  { key: 6, color: 'outline-success' },
  { key: 5, color: 'outline-danger' },
  { key: 4, color: 'outline-light' },
  { key: 3, color: 'outline-warning' },
  { key: 2, color: 'outline-success' },
  { key: 1, color: 'outline-danger' }
]
const SHOW_UID_LENGTH = 8

export default {
  data: () => {
    return {
      LEDStatus: [],
      isSendingCommand: false,
      isLoadingLEDStatus: false,
      statusChangeCount: 0,
      LEDCommandLog: [],
      isSameAsLatastStatus: true,
      recentPhotoLog: {},
      isLoadingPhoto: false
    }
  },
  computed: {
    LEDConfig: () => {
      return LED_CONFIG
    },
    sortedLEDStatus: function () {
      return this.LEDStatus.slice().sort()
    },
    isCommandAvailable: function () {
      return (this.$firebase.isAuthenticated)
    },
    latestLEDCommandLog: function () {
      if (this.LEDCommandLog.length) {
        return this.LEDCommandLog.slice()[0]
      }
      return {}
    }
  },
  methods: {
    onAllLEDs: function () {
      this.LEDStatus = LED_CONFIG.map(v => {
        return v.key
      })
    },
    offAllLEDs: function () {
      this.LEDStatus = []
    },
    formatDate: function (timestamp) {
      if (!timestamp) {
        return ''
      }
      const dateObj = new Date(timestamp.seconds * 1000)
      return this.$date.format(dateObj, 'YYYY/MM/DD HH:mm:ss')
    },
    shortenUid: function (uid) {
      if (!uid) {
        return ''
      }
      return uid.slice(0, SHOW_UID_LENGTH)
    },
    formatUid: function (uid) {
      if (!uid) {
        return ''
      }
      if (!this.$firebase.isAuthenticated) {
        return ''
      }
      let shortenUid = this.shortenUid(uid)
      if (uid === this.$firebase.user.uid) {
        return shortenUid + ' (You)'
      } else {
        return shortenUid
      }
    },
    addLEDCommand: function () {
      let status
      if (this.LEDStatus.length) {
        status = this.sortedLEDStatus
      } else {
        status = []
      }
      this.isSendingCommand = true
      this.$firebase.addLEDCommand(status)
        .then(() => {

        })
        .catch(error => {
          console.log(error)
        })
        .finally(() => {
          this.isSendingCommand = false
        })
    },
    loadRecentLEDStatus: function () {
      this.isLoadingLEDStatus = true
      this.$firebase.getRecentLEDStatus()
        .then(snapshot => {
          snapshot.forEach(doc => {
            console.log('recent status: ', doc.data().status)
            this.LEDStatus = doc.data().status
          })
          this.statusChangeCount = 0
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => {
          this.isLoadingLEDStatus = false
        })
    },
    watchLEDCommandLogCallback: function (snapshot) {
      const tmpLog = []
      snapshot.forEach(doc => {
        tmpLog.push(doc.data())
      })
      this.LEDCommandLog = tmpLog
      this.isSameAsLatastStatus = (JSON.stringify(this.latestLEDCommandLog.status) === JSON.stringify(this.sortedLEDStatus))
    },
    watchLEDCommandLog: function () {
      this.$firebase.getLEDCommandLog(this.watchLEDCommandLogCallback, 10)
    },
    watchPhotoLog: function () {
      this.$firebase.getRecentPhotoLog(this.watchPhotoLogCallback)
    },
    watchPhotoLogCallback: function (snapshot) {
      const tmpLog = []
      snapshot.forEach(doc => {
        tmpLog.push(doc.data())
        console.log(doc.data())
      })
      if (!tmpLog.length) {
        return
      }
      const photoLog = tmpLog[0]
      this.isLoadingPhoto = true
      this.$firebase.getPhotoUrl(photoLog.path)
        .then(url => {
          photoLog['url'] = url
          this.recentPhotoLog = photoLog
        })
        .catch(error => {
          console.error(error)
        })
        .finally(() => {
          this.isLoadingPhoto = false
        })
    }
  },
  watch: {
    'LEDStatus': debounce(function () {
      this.statusChangeCount++
      if (this.statusChangeCount < 2) {
        return
      }
      console.log('debounce')
      this.addLEDCommand()
    }, 1000)
  },
  mounted: function () {
    this.loadRecentLEDStatus()
    this.watchLEDCommandLog()
    this.watchPhotoLog()
  }
}
</script>

<style>

</style>
