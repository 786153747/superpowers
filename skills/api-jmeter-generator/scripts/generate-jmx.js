#!/usr/bin/env node

/**
 * generate-jmx.js
 * 读取 API JSON 文件，生成 JMeter JMX 测试计划
 *
 * 用法: node scripts/generate-jmx.js <json-file-path> [output-path]
 * 无外部依赖（纯 XML 字符串拼接）
 */

const fs = require('fs');
const path = require('path');

// ── XML 转义 ────────────────────────────────────────────

function escapeXml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tryParseJsonValue(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
}

function buildBodyPayload(params) {
  if (!params || params.type !== 'body') return {};

  if (Object.prototype.hasOwnProperty.call(params, 'json')) {
    return params.json;
  }

  if (!Array.isArray(params.fields)) {
    return {};
  }

  const payload = {};
  for (const field of params.fields) {
    payload[field.name] = tryParseJsonValue(field.value);
  }

  return payload;
}

// ── 生成 HTTP Header Manager ─────────────────────────────

function genHeaderManager(name, headers) {
  const items = headers.map(h => `
          <elementProp name="" elementType="Header">
            <stringProp name="Header.name">${escapeXml(h.name)}</stringProp>
            <stringProp name="Header.value">${escapeXml(h.value)}</stringProp>
          </elementProp>`).join('');

  return `
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="${escapeXml(name)}" enabled="true">
          <collectionProp name="HeaderManager.headers">${items}
          </collectionProp>
        </HeaderManager>
        <hashTree/>`;
}

// ── 生成登录请求 + Token 提取 ────────────────────────────

function genLoginRequest(auth, baseUrl) {
  const url = new URL(baseUrl);
  const bodyStr = JSON.stringify(auth.body);

  return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="登录获取Token" enabled="true">
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">${escapeXml(bodyStr)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">\${base_url_host}</stringProp>
          <stringProp name="HTTPSampler.port">\${base_url_port}</stringProp>
          <stringProp name="HTTPSampler.protocol">${escapeXml(url.protocol.replace(':', ''))}</stringProp>
          <stringProp name="HTTPSampler.path">${escapeXml(auth.loginPath)}</stringProp>
          <stringProp name="HTTPSampler.method">${escapeXml(auth.method)}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Login Headers" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Content-Type</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="提取Token" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">token</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">${escapeXml(auth.tokenExtract)}</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
            <stringProp name="JSONPostProcessor.defaultValues">TOKEN_NOT_FOUND</stringProp>
          </JSONPostProcessor>
          <hashTree/>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="登录状态码断言" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message">登录失败</stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>
        </hashTree>`;
}

// ── 生成 HTTP Sampler ───────────────────────────────────

function genHttpSampler(api, baseUrl) {
  const url = new URL(baseUrl);
  let apiPath = api.path;
  let argsXml = '';
  let isRawBody = false;

  if (api.params?.type === 'path') {
    // 替换路径参数
    for (const f of api.params.fields) {
      apiPath = apiPath.replace(`{${f.name}}`, f.value);
    }
  }

  if (api.params?.type === 'query') {
    const fields = api.params.fields.map(f => `
              <elementProp name="${escapeXml(f.name)}" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">true</boolProp>
                <stringProp name="Argument.name">${escapeXml(f.name)}</stringProp>
                <stringProp name="Argument.value">${escapeXml(f.value)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
                <boolProp name="HTTPArgument.use_equals">true</boolProp>
              </elementProp>`).join('');
    argsXml = `
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments">
            <collectionProp name="Arguments.arguments">${fields}
            </collectionProp>
          </elementProp>`;
  } else if (api.params?.type === 'body') {
    isRawBody = true;
    const bodyStr = JSON.stringify(buildBodyPayload(api.params), null, 2);
    argsXml = `
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">${escapeXml(bodyStr)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>`;
  } else {
    argsXml = `
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>`;
  }

  // 生成断言
  let assertionsXml = '';
  if (api.assertions) {
    for (const a of api.assertions) {
      if (a.type === 'status') {
        assertionsXml += `
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="状态码断言: ${escapeXml(a.value)}" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="0">${escapeXml(a.value)}</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message">${escapeXml(api.name)} 状态码不是 ${a.value}</stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>`;
      } else if (a.type === 'jsonpath') {
        if (a.condition === 'exists') {
          assertionsXml += `
          <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="JSON断言: ${escapeXml(a.path)} exists" enabled="true">
            <stringProp name="JSON_PATH">${escapeXml(a.path)}</stringProp>
            <stringProp name="EXPECTED_VALUE"></stringProp>
            <boolProp name="JSONVALIDATION">false</boolProp>
            <boolProp name="EXPECT_NULL">false</boolProp>
            <boolProp name="INVERT">false</boolProp>
            <boolProp name="ISREGEX">false</boolProp>
          </JSONPathAssertion>
          <hashTree/>`;
        } else {
          assertionsXml += `
          <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="JSON断言: ${escapeXml(a.path)}=${escapeXml(a.value)}" enabled="true">
            <stringProp name="JSON_PATH">${escapeXml(a.path)}</stringProp>
            <stringProp name="EXPECTED_VALUE">${escapeXml(a.value)}</stringProp>
            <boolProp name="JSONVALIDATION">true</boolProp>
            <boolProp name="EXPECT_NULL">false</boolProp>
            <boolProp name="INVERT">false</boolProp>
            <boolProp name="ISREGEX">false</boolProp>
          </JSONPathAssertion>
          <hashTree/>`;
        }
      }
    }
  }

  return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${escapeXml(api.id)}: ${escapeXml(api.name)}" enabled="true">
          ${argsXml}
          <stringProp name="HTTPSampler.domain">\${base_url_host}</stringProp>
          <stringProp name="HTTPSampler.port">\${base_url_port}</stringProp>
          <stringProp name="HTTPSampler.protocol">${escapeXml(url.protocol.replace(':', ''))}</stringProp>
          <stringProp name="HTTPSampler.path">${escapeXml(apiPath)}</stringProp>
          <stringProp name="HTTPSampler.method">${escapeXml(api.method)}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>${assertionsXml}
        </hashTree>`;
}

// ── 生成 Thread Group ────────────────────────────────────

function genThreadGroup(name, threads, rampUp, loops, enabled, content) {
  return `
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="${escapeXml(name)}" enabled="${enabled}">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">${loops}</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${threads}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${rampUp}</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
      </ThreadGroup>
      <hashTree>${content}
      </hashTree>`;
}

// ── 生成监听器 ──────────────────────────────────────────

function genListeners() {
  return `
      <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="查看结果树" enabled="true">
        <boolProp name="ResultCollector.error_logging">false</boolProp>
        <objProp>
          <name>saveConfig</name>
          <value class="SampleSaveConfiguration">
            <time>true</time>
            <latency>true</latency>
            <timestamp>true</timestamp>
            <success>true</success>
            <label>true</label>
            <code>true</code>
            <message>true</message>
            <threadName>true</threadName>
            <dataType>true</dataType>
            <encoding>false</encoding>
            <assertions>true</assertions>
            <subresults>true</subresults>
            <responseData>false</responseData>
            <samplerData>false</samplerData>
            <xml>false</xml>
            <fieldNames>true</fieldNames>
            <responseHeaders>false</responseHeaders>
            <requestHeaders>false</requestHeaders>
            <responseDataOnError>false</responseDataOnError>
            <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
            <bytes>true</bytes>
            <sentBytes>true</sentBytes>
            <url>true</url>
            <threadCounts>true</threadCounts>
            <idleTime>true</idleTime>
            <connectTime>true</connectTime>
          </value>
        </objProp>
        <stringProp name="filename"></stringProp>
      </ResultCollector>
      <hashTree/>
      <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="聚合报告" enabled="true">
        <boolProp name="ResultCollector.error_logging">false</boolProp>
        <objProp>
          <name>saveConfig</name>
          <value class="SampleSaveConfiguration">
            <time>true</time>
            <latency>true</latency>
            <timestamp>true</timestamp>
            <success>true</success>
            <label>true</label>
            <code>true</code>
            <message>true</message>
            <threadName>true</threadName>
            <dataType>true</dataType>
            <encoding>false</encoding>
            <assertions>true</assertions>
            <subresults>true</subresults>
            <responseData>false</responseData>
            <samplerData>false</samplerData>
            <xml>false</xml>
            <fieldNames>true</fieldNames>
            <responseHeaders>false</responseHeaders>
            <requestHeaders>false</requestHeaders>
            <responseDataOnError>false</responseDataOnError>
            <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
            <bytes>true</bytes>
            <sentBytes>true</sentBytes>
            <url>true</url>
            <threadCounts>true</threadCounts>
            <idleTime>true</idleTime>
            <connectTime>true</connectTime>
          </value>
        </objProp>
        <stringProp name="filename"></stringProp>
      </ResultCollector>
      <hashTree/>`;
}

// ── 主函数 ──────────────────────────────────────────────

function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('用法: node scripts/generate-jmx.js <json-file-path> [output-path]');
    process.exit(1);
  }

  const absJsonPath = path.resolve(jsonPath);
  if (!fs.existsSync(absJsonPath)) {
    console.error(`文件不存在: ${absJsonPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(absJsonPath, 'utf-8'));
  const outputPath = process.argv[3]
    || path.join(path.dirname(absJsonPath), 'jmeter-test-plan.jmx');

  const baseUrl = data.baseUrl || 'http://localhost:8080';
  const url = new URL(baseUrl);
  const auth = data.auth;
  const perfConfig = data.performanceConfig || { threads: 10, rampUp: 10, loops: 5, thinkTime: 300 };

  // 生成 User Defined Variables（包含解析后的 host/port）
  const userVarsXml = `
      <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="base_url" elementType="Argument">
            <stringProp name="Argument.name">base_url</stringProp>
            <stringProp name="Argument.value">${escapeXml(baseUrl)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="base_url_host" elementType="Argument">
            <stringProp name="Argument.name">base_url_host</stringProp>
            <stringProp name="Argument.value">${escapeXml(url.hostname)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="base_url_port" elementType="Argument">
            <stringProp name="Argument.name">base_url_port</stringProp>
            <stringProp name="Argument.value">${escapeXml(url.port || (url.protocol === 'https:' ? '443' : '80'))}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="username" elementType="Argument">
            <stringProp name="Argument.name">username</stringProp>
            <stringProp name="Argument.value">${escapeXml(auth?.body?.username || 'admin')}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="password" elementType="Argument">
            <stringProp name="Argument.name">password</stringProp>
            <stringProp name="Argument.value">${escapeXml(auth?.body?.password || 'admin123')}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="thinkTime" elementType="Argument">
            <stringProp name="Argument.name">thinkTime</stringProp>
            <stringProp name="Argument.value">${perfConfig.thinkTime}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </Arguments>
      <hashTree/>`;

  // 全局 Header Manager
  const globalHeaders = genHeaderManager('全局请求头', [
    { name: 'Content-Type', value: 'application/json' },
    { name: auth?.headerName || 'Authorization', value: `${auth?.headerPrefix || 'Bearer '}` + '${token}' }
  ]);

  // 生成 API Samplers
  let apiSamplersXml = '';
  for (const api of data.apis) {
    apiSamplersXml += genHttpSampler(api, baseUrl);
  }

  // 功能测试 Thread Group（1 线程, 1 循环, 启用）
  const funcContent = genLoginRequest(auth, baseUrl) + apiSamplersXml;
  const funcThreadGroup = genThreadGroup(
    '接口功能测试', 1, 1, 1, 'true', funcContent
  );

  // 性能测试 Thread Group（可配置, 默认禁用）
  const timerXml = `
        <ConstantTimer guiclass="ConstantTimerGui" testclass="ConstantTimer" testname="思考时间" enabled="true">
          <stringProp name="ConstantTimer.delay">\${thinkTime}</stringProp>
        </ConstantTimer>
        <hashTree/>`;
  const perfContent = genLoginRequest(auth, baseUrl) + timerXml + apiSamplersXml;
  const perfThreadGroup = genThreadGroup(
    '性能测试', perfConfig.threads, perfConfig.rampUp, perfConfig.loops, 'false', perfContent
  );

  // 监听器
  const listenersXml = genListeners();

  // 组装完整 JMX
  const jmx = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${escapeXml(data.projectName)} - API 测试计划" enabled="true">
      <stringProp name="TestPlan.comments">由 api-jmeter-generator skill 自动生成 (${new Date().toISOString()})</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
    </TestPlan>
    <hashTree>
${userVarsXml}
${globalHeaders}
${funcThreadGroup}
${perfThreadGroup}
${listenersXml}
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

  fs.writeFileSync(outputPath, jmx, 'utf-8');

  const methodCounts = {};
  for (const api of data.apis) {
    methodCounts[api.method] = (methodCounts[api.method] || 0) + 1;
  }

  console.log(`✅ JMX 文件已生成: ${outputPath}`);
  console.log(`   接口总数: ${data.apis.length}`);
  for (const [method, count] of Object.entries(methodCounts)) {
    console.log(`   ${method}: ${count} 个`);
  }
  console.log(`   功能测试: 1 线程, 1 循环 (已启用)`);
  console.log(`   性能测试: ${perfConfig.threads} 线程, ${perfConfig.loops} 循环, ${perfConfig.rampUp}s ramp-up (已禁用)`);
}

main();
