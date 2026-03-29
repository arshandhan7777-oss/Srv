export const normalizeClassValue = (value) => String(value ?? '').trim().toUpperCase();

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildClassRegex = (value) => new RegExp(`^\\s*${escapeRegex(normalizeClassValue(value))}\\s*$`, 'i');

export const buildClassAudienceFilter = ({ grade, section }) => ({
  targetGrade: buildClassRegex(grade),
  targetSection: buildClassRegex(section)
});

export const validateAndNormalizeQuestions = (rawQuestions) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('At least one poll question is required.');
  }

  return rawQuestions.map((question, index) => {
    const prompt = String(question?.prompt ?? '').trim();
    if (!prompt) {
      throw new Error(`Question ${index + 1} is missing its prompt.`);
    }

    const normalizedOptions = Array.isArray(question?.options)
      ? question.options.map(option => String(option ?? '').trim()).filter(Boolean)
      : [];

    const uniqueOptions = [...new Set(normalizedOptions)];
    if (uniqueOptions.length < 2) {
      throw new Error(`Question ${index + 1} needs at least two options.`);
    }

    return {
      prompt,
      options: uniqueOptions,
      allowOther: Boolean(question?.allowOther),
      required: question?.required !== false
    };
  });
};

export const validatePollAnswers = (poll, rawAnswers) => {
  if (!Array.isArray(rawAnswers)) {
    throw new Error('Poll answers must be submitted as a list.');
  }

  const answerMap = new Map(
    rawAnswers
      .filter(answer => answer?.questionId)
      .map(answer => [String(answer.questionId), answer])
  );

  return poll.questions.map((question) => {
    const answer = answerMap.get(String(question._id));
    const selectedOption = String(answer?.selectedOption ?? '').trim();
    const otherText = String(answer?.otherText ?? '').trim();

    if (question.required && !selectedOption) {
      throw new Error(`Please answer "${question.prompt}".`);
    }

    if (!selectedOption) {
      return {
        questionId: question._id,
        selectedOption: '',
        otherText: ''
      };
    }

    if (selectedOption === '__OTHER__') {
      if (!question.allowOther) {
        throw new Error(`"${question.prompt}" does not allow custom answers.`);
      }

      if (!otherText) {
        throw new Error(`Please enter your custom response for "${question.prompt}".`);
      }

      return {
        questionId: question._id,
        selectedOption: 'Other',
        otherText
      };
    }

    if (!question.options.includes(selectedOption)) {
      throw new Error(`"${selectedOption}" is not a valid choice for "${question.prompt}".`);
    }

    return {
      questionId: question._id,
      selectedOption,
      otherText: ''
    };
  });
};

export const buildPollAnalytics = (poll, responses) => {
  const totalResponses = responses.length;

  const questions = poll.questions.map((question) => {
    const counts = new Map(question.options.map(option => [option, 0]));
    let otherCount = 0;
    const otherResponses = [];

    responses.forEach((response) => {
      const answer = response.answers.find(item => String(item.questionId) === String(question._id));
      if (!answer || !answer.selectedOption) {
        return;
      }

      if (answer.selectedOption === 'Other' || answer.otherText) {
        otherCount += 1;
        if (answer.otherText) {
          otherResponses.push({
            text: answer.otherText,
            respondentId: response.respondentId,
            respondedAt: response.respondedAt || response.updatedAt || response.createdAt
          });
        }
        return;
      }

      counts.set(answer.selectedOption, (counts.get(answer.selectedOption) || 0) + 1);
    });

    const distribution = question.options.map((option) => {
      const count = counts.get(option) || 0;
      return {
        option,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
      };
    });

    if (question.allowOther) {
      distribution.push({
        option: 'Other',
        count: otherCount,
        percentage: totalResponses > 0 ? Math.round((otherCount / totalResponses) * 100) : 0
      });
    }

    const highest = Math.max(...distribution.map(item => item.count), 0);

    return {
      questionId: question._id,
      prompt: question.prompt,
      totalResponses,
      distribution,
      topOptions: distribution.filter(item => item.count === highest && item.count > 0).map(item => item.option),
      otherResponses
    };
  });

  return {
    totalResponses,
    questions
  };
};
