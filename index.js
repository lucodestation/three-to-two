'use strict'

new Vue({
  name: 'App',
  el: '#app',
  data() {
    return {
      message: '三级表格推算二级表格 Demo',

      showScore: false,

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

      winResult: {},
    }
  },
  mounted() {
    this.juNumber = 3
    this.handleInit()

    if (isLocal()) {
      this.showScore = true
    }
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

      // 更改对手的胜负，如果对手的判罚为空或警告时才可以改对手的胜负，如果对手的判罚是弃权、退赛、判胜、判负时，对手的胜负不能改
      if (position === 0) {
        // 上边的选手

        if (['', '警告'].includes(this.formData[index][1].penalty)) {
          if (value === 1) {
            // 上边的选择负，下边的改成胜
            this.formData[index][1].win_loss = 2
          } else if (value === 2) {
            // 上边的选择胜，下边的改成负
            this.formData[index][1].win_loss = 1
          } else {
            this.formData[index][1].win_loss = value
          }
        }

        // 重置自己的判罚
        this.formData[index][0].penalty = ''
      } else if (position === 1) {
        // 下边的选手

        if (['', '警告'].includes(this.formData[index][0].penalty)) {
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

        // 重置自己的判罚
        this.formData[index][1].penalty = ''
      }

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

      if (position === 0) {
        if (this.formData[index][1].win_loss !== 0 && ['', '警告'].includes(this.formData[index][1].penalty)) {
          if (this.formData[index][1].win_loss === 1) {
            this.formData[index][0].win_loss = 2
          } else if (this.formData[index][1].win_loss === 2) {
            this.formData[index][0].win_loss = 1
          } else if (this.formData[index][1].win_loss === 3) {
            this.formData[index][0].win_loss = 3
          }
        }
      } else if (position === 1) {
        if (this.formData[index][0].win_loss !== 0 && ['', '警告'].includes(this.formData[index][0].penalty)) {
          if (this.formData[index][0].win_loss === 1) {
            this.formData[index][1].win_loss = 2
          } else if (this.formData[index][0].win_loss === 2) {
            this.formData[index][1].win_loss = 1
          } else if (this.formData[index][0].win_loss === 3) {
            this.formData[index][1].win_loss = 3
          }
        }
      }

      this._process()
    },
    // 选择胜负或判罚后的处理
    _process() {
      // 如果有退赛的局
      const quitJuIndex = this.formData.findIndex((item) => item[0].penalty === '退赛' || item[1].penalty === '退赛')

      // 指定局之后的所有局信息重置且禁用
      const funReset = (startJuIndex) => {
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
      funReset(quitJuIndex)

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

        // 局数依次递增，如果有胜负结果，则清除后面录入的信息并禁止录入后边的局
        for (let i = ju; i <= completeJuCount; i++) {
          console.log('第', i, '局')
          // 获取前 i 局
          const list = this.formData.slice(0, i)
          const result = isWin(list, this, this.juNumber, true)
          console.log(result)
          if (result.isWinLoss) {
            console.log('到第', i, '局已有胜负结果')
            funReset(i - 1)
          } else {
            console.warn('到第', i, '局没有胜负结果')
          }
        }
      }
    },

    // 推算
    handleSubmit() {
      const winResult = isWin(this.formData, this, this.juNumber)

      if (winResult.canSubmit) {
        this.$message.success('可提交')

        if (!winResult.isWinLoss) {
          // 没有胜负结果时

          if (winResult.player0.isQuit) {
            winResult.player0.penaltyText = '退赛'
            // winResult.player0.winLossText = '——'
            winResult.player0.winLossText = '负'
          } else {
            winResult.player0.penaltyText = '——'
            winResult.player0.winLossText = '胜'
          }

          if (winResult.player1.isQuit) {
            winResult.player1.penaltyText = '退赛'
            // winResult.player1.winLossText = '——'
            winResult.player1.winLossText = '负'
          } else {
            winResult.player1.penaltyText = '——'
            winResult.player1.winLossText = '胜'
          }
        } else {
          // 有胜负结果时

          if (winResult.player0.isQuit) {
            winResult.player0.penaltyText = '退赛'
            // winResult.player0.winLossText = '——'
            winResult.player0.winLossText = '负'
          } else {
            winResult.player0.penaltyText = '——'

            // if (winResult.player0.score === winResult.player1.score) {
            //   if (winResult.player0.score > 0) {
            //     winResult.player0.winLossText = '胜'
            //   } else if (winResult.player0.score < 0) {
            //     winResult.player0.winLossText = '负'
            //   } else if (winResult.player0.score === 0) {
            //     winResult.player0.winLossText = '平'
            //   }
            // } else if (winResult.player0.score > winResult.player1.score) {
            //   winResult.player0.winLossText = '胜'
            // } else if (winResult.player0.score < winResult.player1.score) {
            //   winResult.player0.winLossText = '负'
            // }

            if (winResult.player0.score === winResult.player1.score) {
              winResult.player0.winLossText = '平'
              if (winResult.player0.allWin && winResult.player1.allWin) {
                winResult.player0.winLossText = '胜'
                winResult.player1.winLossText = '胜'
              }
              if (winResult.player0.allLoss && winResult.player1.allLoss) {
                winResult.player0.winLossText = '负'
                winResult.player1.winLossText = '负'
              }
            } else if (winResult.player0.score > winResult.player1.score) {
              winResult.player0.winLossText = '胜'
            } else if (winResult.player0.score < winResult.player1.score) {
              winResult.player0.winLossText = '负'
            }
          }

          if (winResult.player1.isQuit) {
            winResult.player1.penaltyText = '退赛'
            // winResult.player1.winLossText = '——'
            winResult.player1.winLossText = '负'
          } else {
            winResult.player1.penaltyText = '——'

            // if (winResult.player1.score === winResult.player0.score) {
            //   if (winResult.player1.score > 0) {
            //     winResult.player1.winLossText = '胜'
            //   } else if (winResult.player1.score < 0) {
            //     winResult.player1.winLossText = '负'
            //   } else if (winResult.player1.score === 0) {
            //     winResult.player1.winLossText = '平'
            //   }
            // } else if (winResult.player1.score > winResult.player0.score) {
            //   winResult.player1.winLossText = '胜'
            // } else if (winResult.player1.score < winResult.player0.score) {
            //   winResult.player1.winLossText = '负'
            // }

            if (winResult.player1.score === winResult.player0.score) {
              winResult.player1.winLossText = '平'
              if (winResult.player0.allWin && winResult.player1.allWin) {
                winResult.player0.winLossText = '胜'
                winResult.player1.winLossText = '胜'
              }
              if (winResult.player0.allLoss && winResult.player1.allLoss) {
                winResult.player0.winLossText = '负'
                winResult.player1.winLossText = '负'
              }
            } else if (winResult.player1.score > winResult.player0.score) {
              winResult.player1.winLossText = '胜'
            } else if (winResult.player1.score < winResult.player0.score) {
              winResult.player1.winLossText = '负'
            }
          }
        }
      }

      console.log(_.cloneDeep(winResult))

      this.winResult = winResult
    },
  },
})
