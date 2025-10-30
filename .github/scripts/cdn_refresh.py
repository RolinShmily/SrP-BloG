#!/usr/bin/env python3
# coding=utf-8
# __author__ = 'aliyun.cdn'
# __date__ = '2025-08-15'

# SDK安装命令 pip install alibabacloud_cdn20180510

'''Check Package'''
# 导入所需库
import re, sys, getopt, time, logging, os

try:
    from alibabacloud_cdn20180510.client import Client as Cdn20180510Client
    from alibabacloud_credentials.models import Config as CreConfig
    from alibabacloud_credentials.client import Client as CredentialClient
    from alibabacloud_tea_openapi.models import Config
    from alibabacloud_cdn20180510 import models as cdn_20180510_models
    from alibabacloud_tea_util import models as util_models

# 捕获导入异常
except ImportError as e:
    sys.exit(f"[error] Please pip install alibabacloud_cdn20180510. Details: {e}")

# 初始化日志记录
logging.basicConfig(level=logging.DEBUG, filename='./RefreshAndPredload.log')

# 定义全局变量类，存储AK、SK、FD等信息
class Envariable(object):
    LISTS = []
    # Endpoint 请参考 https://api.aliyun.com/product/Cdn
    ENDPOINT = 'cdn.aliyuncs.com'
    AK = None
    SK = None
    FD = None
    CLI = None
    TASK_TYPE = None
    TASK_AREA = None
    TASK_OTYPE = None

    # 设置AK
    @staticmethod
    def set_ak():
        Envariable.AK = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID')

    # 获取AK
    @staticmethod
    def get_ak():
        return Envariable.AK

    # 设置SK
    @staticmethod
    def set_sk():
        Envariable.SK = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET')

    # 获取SK
    @staticmethod
    def get_sk():
        return Envariable.SK

    # 设置FD
    @staticmethod
    def set_fd(fd):
        Envariable.FD = fd

    # 获取FD
    @staticmethod
    def get_fd():
        return Envariable.FD

    # 设置任务类型
    @staticmethod
    def set_task_type(task_type):
        Envariable.TASK_TYPE = task_type

    # 获取任务类型
    @staticmethod
    def get_task_type():
        return Envariable.TASK_TYPE

    # 设置任务区域
    @staticmethod
    def set_task_area(task_area):
        Envariable.TASK_AREA = task_area

    # 获取任务区域
    @staticmethod
    def get_task_area():
        return Envariable.TASK_AREA

    # 设置任务对象类型
    @staticmethod
    def set_task_otype(task_otype):
        Envariable.TASK_OTYPE = task_otype

    # 获取任务对象类型
    @staticmethod
    def get_task_otype():
        return Envariable.TASK_OTYPE

    # 创建新的Client
    @staticmethod
    def set_acs_client():
        try:
            # 使用AK 初始化Credentials Client。
            credentialsConfig = CreConfig(
                # 凭证类型。
                type='access_key',
                # 设置为AccessKey ID值。
                access_key_id=Envariable.get_ak(),
                # 设置为AccessKey Secret值。
                access_key_secret=Envariable.get_sk(),
            )
            credentialClient = CredentialClient(credentialsConfig)

            cdnConfig = Config(credential=credentialClient)
            # 配置云产品服务接入地址（endpoint）。
            cdnConfig.endpoint = Envariable.ENDPOINT
            # 初始化cdn Client。
            Envariable.CLI = Cdn20180510Client(cdnConfig)
        except Exception as e:
            logging.error(f"Failed to create client: {e}")
            raise

    # 获取Client
    @staticmethod
    def get_acs_client():
        return Envariable.CLI


# 模块级别的初始化函数
def initialize_credentials_and_client():
    """在模块加载时初始化AK、SK和Client"""
    try:
        # 从环境变量初始化AK和SK
        Envariable.set_ak()
        Envariable.set_sk()

        # 检查AK和SK是否成功获取
        if not Envariable.get_ak() or not Envariable.get_sk():
            logging.warning("AK or SK not found in environment variables")
            return False

        # 初始化Client
        Envariable.set_acs_client()
        logging.info("Credentials and client initialized successfully")
        return True
    except Exception as e:
        logging.error(f"Failed to initialize credentials and client: {e}")
        return False


# 在模块加载时执行初始化
_initialization_success = initialize_credentials_and_client()





class BaseCheck(object):
    def __init__(self):
        self.invalidurl = ''
        self.lines = 0
        self.urllist = Envariable.get_fd()

    # 检查配额
    def printQuota(self):
        try:
            client = Envariable.get_acs_client()
            if not client:
                raise Exception("CDN client not initialized")

            # 使用SDK调用方式
            request = cdn_20180510_models.DescribeRefreshQuotaRequest()
            runtime = util_models.RuntimeOptions()
            response = client.describe_refresh_quota_with_options(request, runtime)
            quotaResp = response.body.to_map()
        except Exception as e:
            logging.error(f"\n[error]: initial Cdn20180510Client failed: {e}\n")
            sys.exit(1)

        if Envariable.TASK_TYPE:
            if Envariable.TASK_TYPE == 'push':
                if self.lines > int(quotaResp['PreloadRemain']):
                    sys.exit("\n[error]：PreloadRemain is not enough {0}".format(quotaResp['PreloadRemain']))
                return True
            if Envariable.TASK_TYPE == 'clear':
                if Envariable.get_task_otype() == 'File' and self.lines > int(quotaResp['UrlRemain']):
                    sys.exit("\n[error]：UrlRemain is not enough {0}".format(quotaResp['UrlRemain']))
                elif Envariable.get_task_otype() == 'Directory' and self.lines > int(quotaResp['DirRemain']):
                    sys.exit("\n[error]：DirRemain is not enough {0}".format(quotaResp['DirRemain']))
                else:
                    return True

    # 验证URL格式
    def urlFormat(self):
        try:
            with open(self.urllist, "r") as f:
                for line in f.readlines():
                    self.lines += 1
                    if not re.match(r'^((https)|(http))', line):
                        self.invalidurl = line + '\n' + self.invalidurl
                if self.invalidurl != '':
                    sys.exit("\n[error]: URL format is illegal \n{0}".format(self.invalidurl))
                return True
        except FileNotFoundError:
            sys.exit(f"\n[error]: File not found: {self.urllist}\n")
        except Exception as e:
            sys.exit(f"\n[error]: Failed to read file {self.urllist}: {e}\n")

# 批量处理类，将URL列表按指定数量分成多个批次
class doTask(object):
    @staticmethod
    def urlencode_pl(inputs_str):
        len_str = len(inputs_str)
        if inputs_str == "" or len_str <= 0:
            return ""
        result_end = ""
        for chs in inputs_str:
            if chs.isalnum() or chs in {":", "/", ".", "-", "_", "*"}:
                result_end += chs
            elif chs == ' ':
                result_end += '+'
            else:
                result_end += f'%{ord(chs):02X}'
        return result_end

    # 分批处理URL
    @staticmethod
    def doProd():
        gop = 20  # 这里定义了每个批次的最大URL数量
        mins = 1
        maxs = gop
        current_batch = []  # 使用局部变量而不是全局变量

        try:
            with open(Envariable.get_fd(), "r") as f:
                for line in f.readlines():
                    line = doTask.urlencode_pl(line.strip()) + "\n"
                    current_batch.append(line)
                    if mins >= maxs:
                        yield current_batch
                        current_batch = []
                        mins = 1
                    else:
                        mins += 1
            if current_batch:
                yield current_batch
        except FileNotFoundError:
            sys.exit(f"\n[error]: File not found: {Envariable.get_fd()}\n")
        except Exception as e:
            sys.exit(f"\n[error]: Failed to read file {Envariable.get_fd()}: {e}\n")

    # 执行刷新或预热任务
    @staticmethod
    def doRefresh(lists):
        try:
            client = Envariable.get_acs_client()
            if not client:
                raise Exception("CDN client not initialized")

            runtime = util_models.RuntimeOptions()
            taskID = None
            response_data = None

            if Envariable.get_task_type() == 'clear':
                taskID = 'RefreshTaskId'
                request = cdn_20180510_models.RefreshObjectCachesRequest()
                if Envariable.get_task_otype():
                    request.object_type = Envariable.get_task_otype()
                request.object_path = lists
                response = client.refresh_object_caches_with_options(request, runtime)
                response_data = response.body.to_map()
            elif Envariable.get_task_type() == 'push':
                taskID = 'PushTaskId'
                request = cdn_20180510_models.PushObjectCacheRequest()
                if Envariable.get_task_area():
                    request.area = Envariable.get_task_area()
                request.object_path = lists
                response = client.push_object_cache_with_options(request, runtime)
                response_data = response.body.to_map()

            if response_data and taskID:
                print(response_data)

                timeout = 0
                while True:
                    count = 0
                    # 使用SDK调用方式查询任务状态
                    taskreq = cdn_20180510_models.DescribeRefreshTasksRequest()
                    taskreq.task_id = response_data[taskID]
                    taskresp = client.describe_refresh_tasks_with_options(taskreq, runtime)
                    taskresp_data = taskresp.body.to_map()
                    print(f"[{response_data[taskID]}] is doing... ...")

                    for t in taskresp_data['Tasks']['CDNTask']:
                        if t['Status'] != 'Complete':
                            count += 1
                    if count == 0:
                        logging.info(f"[{response_data[taskID]}] is finish")
                        break
                    elif timeout > 5:  # 最多等待50秒 (5 * 10秒)
                        logging.info(f"[{response_data[taskID]}] timeout after 50 seconds")
                        break
                    else:
                        timeout += 1
                        time.sleep(10)  # 每10秒检查一次状态
                        continue
        except Exception as e:
            logging.error(f"\n[error]：{e}")
            sys.exit(1)


class Refresh(object):
    def main(self, argv):
        if len(argv) < 1:
            sys.exit(f"\n[usage]: {sys.argv[0]} -h ")
        try:
            opts, args = getopt.getopt(argv, "hr:t:a:o:")
        except getopt.GetoptError as e:
            sys.exit(f"\n[usage]: {sys.argv[0]} -h ")

        for opt, arg in opts:
            if opt == '-h':
                self.help()
                sys.exit()
            elif opt == '-r':
                Envariable.set_fd(arg)
            elif opt == '-t':
                Envariable.set_task_type(arg)
            elif opt == '-a':
                Envariable.set_task_area(arg)
            elif opt == '-o':
                Envariable.set_task_otype(arg)
            else:
                sys.exit(f"\n[usage]: {sys.argv[0]} -h ")

        # 只有在非帮助命令时才检查初始化状态
        if not _initialization_success:
            sys.exit("\n[error]: Failed to initialize credentials and client. Please check environment variables.\n")

        try:
            if not (Envariable.get_ak() and Envariable.get_sk() and Envariable.get_fd() and Envariable.get_task_type()):
                sys.exit("\n[error]: Must set environment variables ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET, and parameters '-r', '-t'\n")
            if Envariable.get_task_type() not in {"push", "clear"}:
                sys.exit("\n[error]: taskType Error, '-t' option in 'push' or 'clear'\n")
            if Envariable.get_task_area() and Envariable.get_task_otype():
                sys.exit("\n[error]: -a and -o cannot exist at same time\n")
            if Envariable.get_task_area():
                if Envariable.get_task_area() not in {"domestic", "overseas"}:
                    sys.exit("\n[error]: Area value Error, '-a' option in 'domestic' or 'overseas'\n")
            if Envariable.get_task_otype():
                if Envariable.get_task_otype() not in {"File", "Directory"}:
                    sys.exit("\n[error]: ObjectType value Error, '-a' options in 'File' or 'Directory'\n")
                if Envariable.get_task_type() == 'push':
                    sys.exit("\n[error]: -t must be clear and 'push' -a use together\n")
        except Exception as e:
            logging.error(f"\n[error]: Parameter {e} error\n")
            sys.exit(1)

        handler = BaseCheck()
        if handler.urlFormat() and handler.printQuota():
            for g in doTask.doProd():
                doTask.doRefresh(''.join(g))
                time.sleep(1)

    def help(self):
        print("\nscript options explain: \
                    \n\t -r <filename>                   filename指“文件所在的路径+文件名称”，自动化脚本运行后将会读取文件内记录的URL；文件内的URL记录方式为每行一条URL，有特殊字符先做URLencode，以http或https开头； \
                    \n\t -t <taskType>                   任务类型，clear：刷新，push：预热； \
                    \n\t -a [String,<domestic|overseas>] 可选项，预热范围，不传默认是全球；\
                    \n\t    domestic                     仅中国内地； \
                    \n\t    overseas                     全球（不包含中国内地）； \
                    \n\t -o [String,<File|Directory>]    可选项，刷新的类型； \
                    \n\t    File                         文件刷新（默认值）； \
                    \n\t    Directory                    目录刷新")


if __name__ == '__main__':
    fun = Refresh()
    fun.main(sys.argv[1:])