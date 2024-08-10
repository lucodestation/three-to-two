'use script'

new Vue({
  name: 'App',
  el: '#app',
  data() {
    return {
      message: '三级表格推算二级表格 Demo',

      // 局数
      juNumber: '',
      // 胜负
      winLossList: [
        { value: 0, label: '请选择' },
        { value: 2, label: '胜' },
        { value: 1, label: '负' },
        { value: 3, label: '平' },
      ],
      // 判罚列表
      penaltyList: ['警告', '弃权', '退赛', '判胜', '判负'],

      // [ { sai, player, win_loss, penalty, disabled } ]
      formData: [],

      // canSubmit: false, // 是否可提交（分出胜负后或这个有退赛的并且退赛的那一局胜负录入完整）
      // isWinLoss: false, // canSubmit 是 true 时，是否分出了胜负
      // player0: 0, // 0=未区分, 2=胜, 1=负, 3=平, 4=不记录
      // player1: 0, // 0=未区分, 2=胜, 1=负, 3=平, 4=不记录
      winResult: {},
    }
  },
  mounted() {
    this.juNumber = 3
    this.handleInit()
  },
  methods: {
    handleInit() {
      if (this.juNumber === '') return this.$message.error('请输入局数')
      if (isNaN(this.juNumber)) return this.$message.error('请输入数字')
      if (this.juNumber % 1 !== 0) return this.$message.error('请输入整数')
      if (this.juNumber <= 0) return this.$message.error('请输入正整数')

      const arr = []
      for (let i = 1; i <= this.juNumber; i++) {
        const player1 = { sai: i, player: '甲', win_loss: 0, penalty: '', disabled: false }
        const player2 = { sai: i, player: '乙', win_loss: 0, penalty: '', disabled: false }
        arr.push([player1, player2])
      }

      this.formData = arr
      this.winResult = {}

      console.log(_.cloneDeep(this.formData))
    },
    // 胜负改变 position=0 上边选手，position=1 下边选手
    handleWinLossChange(index, position) {
      // 第一个胜负输入不完整的那一局的索引
      const incompleteIndex = this.formData.findIndex((item) => item[0].win_loss === 0 || item[1].win_loss === 0)
      if (incompleteIndex > -1 && incompleteIndex < index) {
        // 第一个胜负输入不完整的局
        const incompleteJu = this.formData[incompleteIndex][0].sai
        this.$nextTick(() => (this.formData[index][position].win_loss = 0))
        return this.$message.error(`第${incompleteJu}局胜负输入不完整`)
      }

      const value = this.formData[index][position].win_loss

      if (position === 0) {
        if (value === 1) {
          // 上边的选择负，下边的改成胜
          this.formData[index][1].win_loss = 2
        } else if (value === 2) {
          // 上边的选择胜，下边的改成负
          this.formData[index][1].win_loss = 1
        } else {
          this.formData[index][1].win_loss = value
        }
      } else if (position === 1) {
        if (value === 1) {
          // 下边的选择负，上边的改成胜
          this.formData[index][0].win_loss = 2
        } else if (value === 2) {
          // 下边的选择胜，上边的改成负
          this.formData[index][0].win_loss = 1
        } else {
          this.formData[index][0].win_loss = value
        }
      }

      // 重置判罚
      this.formData[index][0].penalty = ''
      this.formData[index][1].penalty = ''

      if (value === 0) {
        // 选择空时当前局及后所有局重置
        this.formData.forEach((dataItem, dataIndex) => {
          if (dataIndex >= index) {
            dataItem[0].win_loss = 0 // 胜负
            dataItem[0].penalty = '' // 判罚
            dataItem[0].disabled = false

            dataItem[1].win_loss = 0 // 胜负
            dataItem[1].penalty = '' // 判罚
            dataItem[1].disabled = false
          }
        })
      }

      this._process()
    },
    // 判罚改变 position=0 上边选手，position=1 下边选手
    handlePenaltyChange(index, position) {
      // 第一个胜负输入不完整的那一局的索引
      const incompleteIndex = this.formData.findIndex((arrangeItem) => arrangeItem[0].win_loss === 0 || arrangeItem[1].win_loss === 0)
      if (incompleteIndex > -1 && incompleteIndex < index) {
        // 第一个胜负输入不完整的局
        const incompleteJu = this.formData[incompleteIndex][0].sai
        this.$nextTick(() => (this.formData[index][position].penalty = ''))
        return this.$message.error(`第${incompleteJu}局胜负输入不完整`)
      }

      const value = this.formData[index][position].penalty

      if (this.formData[index][position].win_loss === 0) {
        // 如果没有录入胜负而是直接判罚了

        if (value === '判负' || value === '弃权' || value === '退赛') {
          this.formData[index][position].win_loss = 1
        } else if (value === '判胜') {
          this.formData[index][position].win_loss = 2
        }
      }

      this._process()
    },
    // 选择胜负或判罚后的处理
    _process() {
      // 如果有退赛的局
      const disabledJuIndex = this.formData.findIndex((item) => item[0].penalty === '退赛' || item[1].penalty === '退赛')

      const funReset = (startJuIndex) => {
        // 退赛的局之后的所有局信息重置且禁用
        if (startJuIndex >= 0) {
          this.formData.forEach((item, index) => {
            if (index > startJuIndex) {
              item[0].win_loss = 0
              item[0].penalty = ''
              item[0].disabled = true
              item[1].win_loss = 0
              item[1].penalty = ''
              item[1].disabled = true
            }
          })
          return
        } else {
          this.formData.forEach((item) => {
            item[0].disabled = false
            item[1].disabled = false
          })
        }
      }
      funReset(disabledJuIndex)

      // ----------

      // 胜负录入完整的局数
      const completeJuCount = this.formData.reduce((count, item) => {
        if (item[0].win_loss !== 0 && item[1].win_loss !== 0) {
          count++
        }
        return count
      }, 0)
      console.log('已录入的局数', completeJuCount)

      // 如果录入的局数超过一半
      if (completeJuCount > this.formData.length / 2) {
        console.log('录入的局数超过一半')

        // 拿到一半以上的最少局数（5局拿3局，6局拿4局）
        const ju = this.juNumber % 2 ? Math.ceil(this.juNumber / 2) : this.juNumber / 2 + 1
        console.log('至少要录', ju, '局')

        // 局数依次递增，如果已分出胜负，则清除后面录入的信息并禁止录入后边的局
        for (let i = ju; i <= completeJuCount; i++) {
          console.log('第', i, '局')
          // 获取前 i 局
          const list = this.formData.slice(0, i)
          const result = isWin(list, this, this.juNumber, true)
          console.log(result)
          if (result.player0 !== result.player1) {
            console.log('到第', i, '局已分出胜负')
            funReset(i - 1)
          } else {
            console.warn('到第', i, '局未分出胜负')
          }
        }
      }
    },

    // 推算
    handleSubmit() {
      this.winResult = isWin(this.formData, this.juNumber, this)
      console.log(_.cloneDeep(this.winResult))
      if (this.winResult.canSubmit) {
        this.$message.success('可提交')
      }
    },
  },
})
