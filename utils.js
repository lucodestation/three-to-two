'use strict'

// 个人赛三级表格成绩是否有胜负结果
// 有没有胜负结果是根据去除退赛的判罚后，拿已录的胜负、判罚和总局数来计算的，如果未录的局能把已录成绩的胜负结果否定掉，则没有胜负结果
const isWin = (formData, that, totalJu, hideMessage) => {
  const result = {
    canSubmit: false, // 是否可提交（有胜负结果 或 有退赛的并且退赛的那一局胜负录入完整）
    isWinLoss: false, // 是否有胜负结果
    player0: {
      score: '', // 分，临时使用，有胜负结果时使用该值和对手的该值判断胜负
      isQuit: false, // 是否有退赛
    },
    player1: {
      score: '',
      isQuit: false,
    },
  }

  // 如果第1局没有录入
  if (!formData[0][0].win_loss && !formData[0][1].win_loss) {
    if (!hideMessage) {
      that.$message({ message: `第1局：请录入胜负`, type: 'error' })
    }
    return result
  }

  // 第一个胜负输入不完整的那一局的索引
  const incompleteIndex = formData.findIndex(
    (arrangeItem) => (arrangeItem[0].win_loss === 0 && arrangeItem[1].win_loss !== 0) || (arrangeItem[0].win_loss !== 0 && arrangeItem[1].win_loss === 0),
  )
  if (incompleteIndex > -1) {
    // 第一个胜负输入不完整的局
    const incompleteJu = formData[incompleteIndex][0].sai
    if (!hideMessage) {
      that.$message({ message: `第${incompleteJu}局：胜负录入不完整`, type: 'error' })
    }
    return result
  }

  // 胜+1分，负-1分，平0分

  // 这个分只是临时判断胜负用
  result.player0.score = formData.reduce((score, item) => {
    const playerIndex = 0

    // 先判断判罚，有判罚以判罚为准，判罚不存在再判断胜负
    if (['弃权', '判负', '判胜'].includes(item[playerIndex].penalty)) {
      if (item[playerIndex].penalty === '弃权' || item[playerIndex].penalty === '判负') {
        score--
      } else if (item[playerIndex].penalty === '判胜') {
        score++
      }
    } else {
      if (item[playerIndex].win_loss === 1) {
        score--
      } else if (item[playerIndex].win_loss === 2) {
        score++
      }
    }

    return score
  }, 0)
  result.player1.score = formData.reduce((score, item) => {
    const playerIndex = 1
    // 先判断判罚，有判罚以判罚为准，判罚不存在再判断胜负
    if (['弃权', '判负', '判胜'].includes(item[playerIndex].penalty)) {
      if (item[playerIndex].penalty === '弃权' || item[playerIndex].penalty === '判负') {
        score--
      } else if (item[playerIndex].penalty === '判胜') {
        score++
      }
    } else {
      if (item[playerIndex].win_loss === 1) {
        score--
      } else if (item[playerIndex].win_loss === 2) {
        score++
      }
    }
    return score
  }, 0)
  console.log(result)

  console.log('----------', +new Date(), '----------')

  // 胜负录入完整的局数
  const completeJuCount = formData.reduce((count, item) => {
    if (item[0].win_loss !== 0 && item[1].win_loss !== 0) {
      count++
    }
    return count
  }, 0)

  // 如果录入的局数没有超过一半
  if (completeJuCount <= totalJu / 2) {
    console.log('录入的局数没有超过一半')

    // 判断是否有退赛
    const quitIndex = formData.findIndex((item) => item[0].penalty === '退赛' || item[1].penalty === '退赛')
    if (quitIndex >= 0) {
      console.log(`第${formData[quitIndex][0].sai}局：有退赛`)

      result.player0.isQuit = formData[quitIndex][0].penalty === '退赛'
      result.player1.isQuit = formData[quitIndex][1].penalty === '退赛'

      result.canSubmit = true
      return result
    }

    const juArrangeInfo = formData.find((item) => item[0].win_loss === 0 || item[1].win_loss === 0)
    if (!hideMessage) {
      that.$message({ message: `第${juArrangeInfo[0].sai}局：请录入胜负`, type: 'error' })
    }
    return result
  }

  // 胜负未录入的局数
  const emptyJuCount = totalJu - completeJuCount

  // 所有局都已录完
  if (emptyJuCount === 0) {
    console.log('所有局都已录完，已有胜负结果')

    result.canSubmit = true
    result.isWinLoss = true

    // 判断是否有退赛
    const quitIndex = formData.findIndex((item) => item[0].penalty === '退赛' || item[1].penalty === '退赛')
    if (quitIndex >= 0) {
      console.log(`第${formData[quitIndex][0].sai}局：有退赛`)

      result.player0.isQuit = formData[quitIndex][0].penalty === '退赛'
      result.player1.isQuit = formData[quitIndex][1].penalty === '退赛'

      result.canSubmit = true
      return result
    }

    return result
  }

  // 向下走，肯定是在胜负没有录完的情况下

  // 两个选手的分数差
  const scoreDiff = Math.abs(result.player0.score - result.player1.score)
  // console.log({ scoreDiff, emptyJuCount })

  // 如果 两个选手的分数差的一半 小于等于 未录入的局数
  if (scoreDiff <= 2 || scoreDiff / 2 <= emptyJuCount) {
    console.log('未录完，没有胜负结果，需继续录入')

    // 判断是否有退赛
    const quitIndex = formData.findIndex((item) => item[0].penalty === '退赛' || item[1].penalty === '退赛')
    if (quitIndex >= 0) {
      console.log(`第${formData[quitIndex][0].sai}局：有退赛`)

      result.player0.isQuit = formData[quitIndex][0].penalty === '退赛'
      result.player1.isQuit = formData[quitIndex][1].penalty === '退赛'

      result.canSubmit = true
      return result
    }

    const juArrangeInfo = formData.find((item) => item[0].win_loss === 0 || item[1].win_loss === 0)
    if (!hideMessage) {
      that.$message({ message: `第${juArrangeInfo[0].sai}局：请录入胜负`, type: 'error' })
    }
    return result
  } else {
    console.log('未录完，有胜负结果')
    result.canSubmit = true
    result.isWinLoss = true

    // 判断是否有退赛
    const quitIndex = formData.findIndex((item) => item[0].penalty === '退赛' || item[1].penalty === '退赛')
    if (quitIndex >= 0) {
      console.log(`第${formData[quitIndex][0].sai}局：有退赛`)

      result.player0.isQuit = formData[quitIndex][0].penalty === '退赛'
      result.player1.isQuit = formData[quitIndex][1].penalty === '退赛'

      result.canSubmit = true
      return result
    }

    return result
  }
}
