<?php

declare(strict_types=1);
// +----------------------------------------------------------------------
// | swiftAdmin 极速开发框架 [基于ThinkPHP6开发]
// +----------------------------------------------------------------------
// | Copyright (c) 2020-2030 http://www.swiftadmin.net
// +----------------------------------------------------------------------
// | swiftAdmin.net High Speed Development Framework
// +----------------------------------------------------------------------
// | Author: 权栈 <coolsec@foxmail.com> Apache 2.0 License Code
// +----------------------------------------------------------------------
namespace app\common\library;

use Elasticsearch\ClientBuilder;
use app\common\model\system\Fulltext as FulltextModel;

/**
 * ElasticSearch全文索引类
 * @ElasticSearch  7.15 - 7.16
 */
class ElasticSearch
{

    /**
     * @var object 对象实例
     */
    protected static $instance = null;

    /**
     * 全局对象
     *
     * @var object
     */
    protected object $_client;

    /**
     * 索引标识
     *
     * @var string
     */
    protected string $_index = '';

    /**
     * 索引字段
     *
     * @var array
     */
    private array $_app_field = [];

    /**
     * 必选字段
     *
     * @var array
     */
    public  array $_mustbeFields = ['id', 'title', 'content', 'status'];

    /**
     * 高亮字段
     *
     * @var array
     */
    public $_highlight_field = [];

    /**
     * 查询规则
     *
     * @var array
     */
    public $_where = [];

    /**
     * 查询参数
     *
     * @var array
     */
    protected array $_option = ['page' => 0];

    /**
     * 查询毫秒
     *
     * @var float
     */
    protected float $_seconds = 0;

    /**
     * 字段排序
     *
     * @var mixed
     */
    protected mixed $_sort = null;

    /**
     * 索引状态
     *
     * @var mixed
     */
    protected mixed $_status = false;

    /**
     * 错误信息
     *
     * @var string
     */
    protected $_error = '';

    /**
     * @objectValidate
     */
    public $objectValidate = null;

    /**
     * 类构造函数
     * class constructor.
     */
    public function __construct()
    {
        // 启动索引服务
        $this->_status = saenv('search_status');
    }

    /**
     * 初始化
     * @access public
     * @param array $options 参数
     * @return self
     */
    public static function instance($options = [])
    {
        if (is_null(self::$instance)) {
            self::$instance = new static($options);
        }

        // 返回实例
        return self::$instance;
    }

    /**
     * 创建索引
     *
     * @param array $data
     * @return void
     * @return void
     */
    public function indices(array $data = [])
    {

        try {

            $this->_client = ClientBuilder::create()->setHosts($this->parseHttpServer($data['index'], $data))->build();

            $params = [
                'index' => $data['name'],
                'body' => [
                    'settings' => [
                        'number_of_shards' => 3,
                        'number_of_replicas' => 2,
                    ]
                ]
            ];

            // 创建索引
            if (!$this->_client->indices()->exists(['index' => $data['name']])) {
                $this->_client->indices()->create($params);
            }
        } catch (\Throwable $th) {
            throw new \Exception($th->getMessage());
        }
    }

    /**
     * 删除索引
     *
     * @param array $data
     * @return void
     * @return void
     */
    public function delices(array $data = [])
    {
        try {

            $this->_client = ClientBuilder::create()->setHosts($this->parseHttpServer($data['index'], $data))->build();

            $params = [
                'index' => $data['name'],
            ];

            // 删除索引
            if ($this->_client->indices()->exists($params)) {
                $this->_client->indices()->delete($params);
            }
        } catch (\Throwable $th) {
            throw new \Exception($th->getMessage());
        }
    }


    /**
     * 格式化服务器信息
     *
     * @param mixed $hosts
     * @param array $login
     * @return void|array
     */
    protected function parseHttpServer($hosts = null, $login = [])
    {
        if (!is_array($hosts)) {
            $hosts = explode(';', $hosts);
        }

        $connection = [];
        foreach ($hosts as $key => $value) {

            // 处理字符串
            if (is_string($value)) {
                $value = rtrim($value, '/');
                $value = str_replace(['http://', 'https://'], '', $value);
                $connection[$key]['host'] = substr($value, 0, strrpos($value, ":"));
                $connection[$key]['port'] = substr(strrchr($value, ":"), 1);
                if (isset($login['username']) && $login['username']) {
                    $connection[$key]['user'] = $login['username'];
                }

                if (isset($login['password']) && $login['password']) {
                    $connection[$key]['pass'] = $login['password'];
                }
            } else {
                $connection[$key] = $value;
            }
        }

        return $connection;
    }

    /**
     * 创建Mapping
     *
     * @param array $properties
     * @return void
     */
    public function putMapping(array $properties = [])
    {

        try {

            /**
             * 强选项字段
             */
            $field_name = array_flip($properties['field_name']);
            foreach ($this->_mustbeFields as $key) {
                if (!array_key_exists($key, $field_name)) {
                    throw new \Exception('The lack of necessary key values');
                }
            }

            $properties = $this->parElasticSearch($properties);
            $params = [
                'index' => $this->_index,
                'body' => [
                    'properties' => $properties
                ]
            ];

            $this->_client->indices()->putMapping($params);
        } catch (\Throwable $th) {
            throw new \Exception($th->getMessage());
        }

        return $properties;
    }

    /**
     * 解析ES配置
     *
     * @param array $post
     * @return void
     */
    protected function parElasticSearch(array $post = [])
    {
        // 循环配置
        foreach ($post['field_name'] as $key => $value) {

            $field[$value]['type'] = $post['field_type'][$key];

            if ($post['field_type'][$key] == 'date') {
                $field[$value]['format'] = 'yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis';
            }

            if ($post['field_type'][$key] == 'text') {

                if ($post['field_index'][$key] !== 'none') {
                    $field[$value]['index'] = $post['field_index'][$key];
                }

                if ($post['field_analyzer'][$key] !== 'defalut') {
                    $field[$value]['analyzer'] = $post['field_analyzer'][$key];
                }

                if ($post['field_search_analyzer'][$key] !== 'defalut') {
                    $field[$value]['search_analyzer'] = $post['field_search_analyzer'][$key];
                }
            }
        }

        return isset($field) ? $field : [];
    }

    /**
     * 项目索引
     * @param  string $app  项目名称
     * @return this
     */
    public function index(string $app = null)
    {
        $this->_index = !empty($app) ? $app : 'content';

        // 查询服务器
        $app = FulltextModel::getApp($app, 'ElasticSearch');

        // 链接服务器
        $this->_client = ClientBuilder::create()->setHosts($this->parseHttpServer($app['index'], [
            'username' => $app['username'],
            'password' => $app['password'],
        ]))
            ->setConnectionPool('\Elasticsearch\ConnectionPool\StaticNoPingConnectionPool')
            ->setSelector('\Elasticsearch\ConnectionPool\Selectors\StickyRoundRobinSelector')->build();

        // 保留字段集
        if (!empty($app['field'])) {
            $field = unserialize($app['field']);
            foreach ($field as $key => $value) {
                $this->_app_field[$key] = $value['type'];
            }
        }

        return $this;
    }

    /**
     * 更新文档索引
     *
     * @param array $data
     * @param bool $justUpdate 是否只更新
     * @return void
     */
    public function save(array $data = [], $justUpdate = false)
    {
        if (!empty($data) && $this->_status) {

            $data = array_intersect_key($data, $this->_app_field);

            // 默认祛除HTML标签
            if (isset($data['content']) && $data['content']) {
                $data['content'] = msubstr($data['content'], -1);
                $data['content'] = preg_replace('/&[a-z]{1,5};/',"",$data['content']);
            }

            $result = [];
            $params = [
                'index' => $this->_index,
                'type'  => '_doc',
                'id'    => $data['id'],
                'body'  => $data,
            ];

            try {

                // 捕获异常
                $result = $this->_client->get([
                    'index' => $this->_index,
                    'type'  => '_doc',
                    'id'  => $data['id'],
                ]);
            } catch (\Throwable $th) {
            }

            try {

                // 创建文档
                if (empty($result) && !$justUpdate) {
                    $response = $this->_client->index($params);
                } else {
                    $params['body'] = [
                        'doc' => $data
                    ];
                    $response = $this->_client->update($params);
                }
            } catch (\Throwable $th) {
                $this->setError($th->getMessage());
            }

            return $this->_error ? $this->_error : $response;
        }
    }

    /**
     * 删除文档
     * @param array|integer|null $ids
     * @return void
     */
    public function delete(array|int $ids = null)
    {
        if (!empty($ids) && $this->_status) {

            if (!is_array($ids)) {
                $ids = array($ids);
            }

            foreach ($ids as $id) {
                # code...
                $params = [
                    'index' => $this->_index,
                    'id' => $id
                ];

                $this->_client->delete($params);
            }
        }
    }

    /**
     * 搜索数据源
     *
     * @param string|null $keyword
     * @param string|array $field
     * @return void
     */
    public function search($query = null, array $field = [])
    {
        if ($this->_option['page'] == 0) {
            $length = isset($this->_option['length']) ? $this->_option['length'] : 10;
            $offset = isset($this->_option['offset']) ? $this->_option['offset'] : 0;
        } else {
            $length = isset($this->_option['length']) ? $this->_option['length'] : 10;
            $offset = $this->_option['page'] ? $this->_option['length'] * ($this->_option['page'] - 1) : 0;
        }

        // 封装查询体
        $queryParam = [
            'index' => $this->_index,
            'from' => $offset,
            'size' => $length
        ];

        // 封装查询规则
        if (is_array($query)) {
            $queryParam['body'] = $query;
        } else {

            $field = !empty($field) ? $field : 'title';
            
            if (!is_array($field)) {
                $field = explode(',',$field);
            }

            foreach ($field as $key => $value) {
                $conditions['bool']['should'][$key]['match'][$value] = $query;
            }

            // "must" : [AND],"should" : [ORS],"must_not" : [NOT],
            if (!empty($this->_where)) {

                if (isset($conditions['bool']['must'])) {
                    $conditions['bool']['must'] = array_merge_recursive($conditions['bool']['must'], $this->_where);
                }else {
                    $conditions['bool']['must'] = $this->_where;
                }
                
                $conditions['bool']['must'] = array_values(array_unique($conditions['bool']['must'],SORT_REGULAR));
            }


            // 默认搜索规则
            $conditions['bool']['must'][] = [
                'match' => [
                    'status' => 1,
                ]
            ];

            $queryParam['body'] = ['query' => $conditions];
        }

        dump($queryParam);

        if ($this->_highlight_field) {
            $queryParam['body']['highlight']['fields'] = $this->_highlight_field;
        }

        if (!empty($this->_sort)) {
            $queryParam['body']['sort'] = $this->_sort;
        }

        // 精确搜索
        $queryParam['track_total_hits'] = true;

        // 查询索引
        $result = $this->_client->search($queryParam);

        // 文档总数
        $statsInfo = $this->statsInfo();
        $_total = $statsInfo['docs']['count'];
        $_size_in_bytes = $statsInfo['store']['size_in_bytes'];

        // 查询总数
        $this->_count = $result['hits']['total']['value'];

        // 查询耗时
        $this->_seconds = ($result['took'] / 1000);

        $list = [];
        foreach ($result['hits']['hits'] as $key => $value) {
            $list[$key] = $value['_source'];
            if (isset($value['highlight'])) {
                foreach ($value['highlight'] as $field => $fragment) {
                    $list[$key][$field] = $fragment[0];
                }
            }
        }

        return ['data'=> $list, 'count' => $this->_count, 'seconds'=> $this->_seconds, 'total' => $_total, 'byte'=>$_size_in_bytes];
    }
    
    /**
     * 指定查询条件
     * @access public
     * @param mixed $field     查询字段
     * @param mixed $op        查询表达式
     * @param mixed $condition 查询条件
     * @return $this
     */
    public function where($fields, $op = null, $condition = null)
    {
        if (!is_array($fields) && $op !== null) {

            
            if (!$condition) {
                $this->_where[]['match'] = [
                    $fields => $op
                ];
            } else {
                $this->_where = $this->parseQueryWhere($fields, $op, $condition);
            }
        } else {
            foreach ($fields as $key => $meta) {
                list($field, $op, $condition) = $meta;

                // 循环处理字段集
                if (array_key_exists($field, $this->_app_field)) {
                    $this->_where[$key] = $this->parseQueryWhere($field, $op, $condition);
                }
            }
        }

        return $this;
    }

    /**
     * 解析语句
     *
     * @param [type] $field
     * @param [type] $op
     * @param [type] $condition
     * @return void
     */
    public function parseQueryWhere(string $field, string $op, string $condition)
    {
        switch (strtolower($op)) {
            case '>':
                $array['term'] = [
                    $field => [
                        'gt' => $condition
                    ]
                ];
                break;
            case '<':
                $array['term'] = [
                    $field => [
                        'lt' => $condition
                    ]
                ];
                break;
            case '>=':
                $array['term'] = [
                    $field => [
                        'gte' => $condition
                    ]
                ];
                break;
            case '<=':
                $array['term'] = [
                    $field => [
                        'lte' => $condition
                    ]
                ];
                break;
            case '!=':
            case '!==':
                $array['term'] = [
                    $field => [
                        'neq' => $condition
                    ]
                ];
                break;
            case 'in':
                if (!is_array($condition)) {
                    $condition = explode(',', (string)$condition);
                }
                $array['terms'] = [$field => $condition];
                break;
            case 'like':
            default:
                $condition = str_replace('%', '', (string)$condition);
                $array['term'] = [$field => $condition];
                break;
        }

        return $array;
    }

    /**
     * 查询字段高亮
     *
     * @param mixed $fields
     * @return void
     */
    public function highlight(array|string $fields)
    {
        if (!is_array($fields)) {
            $fields = str_replace(array('，', '|', '-'), ',', $fields);
            $fields = explode(',', $fields);
        }

        foreach ($fields as $value) {
            $this->_highlight_field[$value] = new \stdClass();
        }

        return $this;
    }

    /**
     * 分页查询
     *
     * @param integer $offset   数据偏移
     * @param integer $length   查询条数
     * @return void
     */
    public function limit(int $offset = 0, int $length = 0)
    {
        if (empty($length)) {
            $this->_option['length'] = $offset;
            $this->_option['offset'] = 0;
        } else {
            $this->_option['length'] = $length;
            $this->_option['offset'] = $offset;
        }

        return $this;
    }

    /**
     * 搜索分页
     *
     * @param integer $page
     * @return void
     */
    public function page(int $page = 1)
    {
        $this->_option['page'] = $page == 0 ? 1 : $page;
        return $this;
    }

    /**
     * 获取索引库
     *
     * @return void
     */
    public function statsInfo()
    {
        try {

            /**
             * 返回索引库
             */
            $stats = $this->_client->indices()->stats(['index' => $this->_index]);
            $stats = $stats['indices'][$this->_index];
            $statsInfo = $stats['primaries'];
            $statsInfo['uuid'] = $stats['uuid'];
            return $statsInfo;

        } catch (\Throwable $th) {
            throw new \Exception($th->getMessage());
        }
    }    

    /**
     * 获取索引状态
     *
     * @return void
     */
    public function cluster()
    {
        return $this->_client->cluster()->stats();
    }

    /**
     * 搜索排序
     * @param string  $field     // 字段
     * @param string    $asc       // 排序方式
     * @return void
     */
    public function order(string $field = 'id', string $asc = 'asc')
    {
        $this->_sort = [$field => $asc];
        return $this;
    }

    /**
     * 模糊搜索
     * @param bool  $status     // 搜索状态
     * @return void
     */
    public function setFuzzy(bool $status = false)
    {
        return $this;
    }

    /**
     * 获取搜索热词
     * 可做数据分析用
     * @param integer   $limit  限定词数
     * @param string    $type   搜索条件currnum/lastnum/total
     * @return void
     */
    public function getHotKeys(int $limit = 6, string $type = 'total')
    {
        return [];
    }

    /**
     * 搜索匹配数
     * @return int 
     */
    public function getCount()
    {
        return $this->_count;
    }

    /**
     * 获取搜索耗时
     * 单位/秒
     * @return void
     */
    public function getSecond()
    {
        return $this->_seconds;
    }

    /**
     * 获取字段集
     *
     * @return void|array
     */
    public function getField()
    {
        return $this->_app_field;
    }

    /**
     * 获取最后产生的错误
     * @return string
     */
    public function getError()
    {
        return $this->_error;
    }

    /**
     * 设置错误
     * @param string $error 信息信息
     */
    protected function setError($error)
    {
        $this->_error = $error;
    }
}
