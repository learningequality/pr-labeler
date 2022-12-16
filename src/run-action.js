const createLabelIfNotExists = require('./github/create-label-if-not-exists');
const addLabel = require('./github/add-label');
const removeLabel = require('./github/remove-label');
const existsLabel = require('./github/exists-label');

const getLabelConfig = (tools) => {
  const labelConfig = [
    {
      name: 'SIZE: very small',
      size: tools.inputs.xs_max_size,
      color: 'abdee6',
    },
    {
      name: 'SIZE: small',
      size: tools.inputs.s_max_size,
      color: 'abdee6',
    },
    {
      name: 'SIZE: medium',
      size: tools.inputs.m_max_size,
      color: 'abdee6',
    },
    {
      name: 'SIZE: large',
      size: tools.inputs.l_max_size,
      color: 'abdee6',
    },
    {
      name: 'SIZE: very large',
      size: Infinity,
      color: 'abdee6',
    },
  ];
  return labelConfig;
};

const createLabelsIfNotExists = async (tools, labelConfig) => {
  await Promise.all(
    labelConfig.map((item) =>
      createLabelIfNotExists(tools, item.name, { color: item.color }),
    ),
  );
};

/**
 * @param {import('actions-toolkit').Toolkit} tools
 */

const getNumberOfLines = async (tools) => {
  try {
    tools.log.info(`Getting the number of lines`);
    const { data: files } = await tools.github.pulls.listFiles({
      ...tools.context.repo,
      pull_number: tools.context.issue.number,
    });
    const numberOfLines = files.reduce((accumulator, file) => {
      if (file.filename.match(tools.inputs.exclude_files)) {
        tools.log.info(`Excluding file from the counting ${file.filename}`);
        return accumulator;
      }
      tools.log.info(`Adding file to the counting: ${file.filename} The number of lines is: ${file.changes}`);
      return accumulator + file.changes;
    }, 0);
    tools.log.info(`Number of lines changed: ${numberOfLines}`);
    return numberOfLines;
  } catch (error) {
    tools.log.info(
      `Error happens when we listing the files of the pull request: ${error}`,
    );
  }
};

const assignLabelForLineChanges = async (tools, numberOfLines, labelConfig) => {
  await Promise.all(
    labelConfig.map(async (item) => {
      const { name } = item;
      if (await existsLabel(tools, name)) {
        await removeLabel(tools, name);
      }
    }),
  );

  const element = labelConfig.find((elem) => numberOfLines <= elem.size);
  if (element) {
    await addLabel(tools, element.name);
  }
};

module.exports = async (tools) => {
  const labelConfig = getLabelConfig(tools);
  await createLabelsIfNotExists(tools, labelConfig);
  const numberOfLines = await getNumberOfLines(tools);
  await assignLabelForLineChanges(tools, numberOfLines, labelConfig);
};
