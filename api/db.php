<?php
class DB {
    private static $conn;

    public static function init($connStr, $user, $pass)
    {

        self::$conn = new PDO($connStr, $user, $pass);
        $init = array(
            'SET CHARACTER SET UTF8',
            'SET character_set_client = "utf8"',
            'SET character_set_results = "utf8"',
            'SET collation_connection = "utf8_unicode_ci"'
        );
        foreach($init as $q) {
            self::exec($q);
        }
    }

    public static function exec($q)
    {
        return self::$conn->exec($q);
    }

    public static function fetchAll($q)
    {
        $sth = self::$conn->prepare($q);
        $sth->setFetchMode(PDO::FETCH_ASSOC);
        $sth->execute();

        return $sth->fetchAll();
    }
    public static function fetch($q)
    {
        $sth = self::$conn->prepare($q);
        $sth->setFetchMode(PDO::FETCH_ASSOC);
        $sth->execute();
        return $sth->fetch();
    }
}