<?php

namespace App\Console\Commands;

use App\Models\KnowledgeItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VectorizeDatabaseCommand extends Command
{
    protected $signature = 'ai:vectorize-db
        {--max-rows-per-table=200 : Batas baris per tabel agar tidak meledak biaya}
        {--force : Force regenerate embedding (lebih mahal)}
        {--exclude-tables= : Komma-dipisah daftar tabel untuk dikecualikan}
    ';

    protected $description = 'Vectorize database tables into knowledge_items (pgvector).';

    public function handle(): int
    {
        $driver = DB::connection()->getDriverName();

        if ($driver !== 'pgsql') {
            $this->warn('ai:vectorize-db hanya didukung untuk PostgreSQL/pgvector.');

            return self::SUCCESS;
        }

        $excludeTables = array_filter(array_map(
            fn (string $t) => trim($t),
            explode(',', (string) $this->option('exclude-tables')),
        ));

        // Default exclusions untuk tabel internal / infrastruktur.
        $excludeTables = array_merge([
            'knowledge_items',
            'agent_conversations',
            'agent_conversation_messages',
            'cache',
            'jobs',
            'migrations',
            'failed_jobs',
            'sessions',
            'personal_access_tokens',
        ], $excludeTables);

        $maxRowsPerTable = (int) $this->option('max-rows-per-table');
        $force = (bool) $this->option('force');

        $tables = DB::select("
            select table_name
            from information_schema.tables
            where table_schema = 'public'
              and table_type = 'BASE TABLE'
            order by table_name
        ");

        $tableNames = array_map(fn ($row) => $row->table_name, $tables);

        $tablesToProcess = array_values(array_diff($tableNames, $excludeTables));

        $this->info('Tables to process: '.count($tablesToProcess));

        foreach ($tablesToProcess as $table) {
            $this->line('Processing table: '.$table);

            $columns = DB::select("
                select column_name
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = ?
                order by ordinal_position
            ", [$table]);

            $columnNames = array_map(fn ($row) => $row->column_name, $columns);

            $sensitiveColumns = [
                'password',
                'remember_token',
                'two_factor_secret',
                'two_factor_recovery_codes',
            ];

            // Buang kolom sensitif + embedding (jika ada) supaya tidak bocor.
            $allowedColumns = array_values(array_filter($columnNames, function ($c) use ($sensitiveColumns) {
                $c = strtolower((string) $c);

                return ! in_array($c, $sensitiveColumns, true)
                    && $c !== 'embedding';
            }));

            if (count($allowedColumns) === 0) {
                $this->warn('  - Skip (no allowed columns)');

                continue;
            }

            // Ambil primary key yang umum: `id`. Kalau tidak ada, gunakan kolom pertama.
            $pk = in_array('id', $columnNames, true) ? 'id' : ($allowedColumns[0] ?? null);

            if (! $pk) {
                continue;
            }

            $rows = DB::table($table)
                ->select($allowedColumns)
                ->limit($maxRowsPerTable)
                ->get();

            foreach ($rows as $row) {
                /** @var array<string, mixed> $attrs */
                $attrs = (array) $row;

                $pkVal = $attrs[$pk] ?? null;
                $title = "table:{$table}:{$pk}:".(is_scalar($pkVal) ? (string) $pkVal : 'unknown');

                // Representasi dokumen ringkas agar embedding tidak terlalu besar.
                $contentJson = json_encode($attrs, JSON_UNESCAPED_UNICODE);
                $contentJson = Str::limit($contentJson ?: '', 3500, '');

                // Upsert ke knowledge_items.
                $data = [
                    'content' => $contentJson,
                    'updated_at' => now(),
                ];

                if ($force) {
                    // Force: hapus embedding lama agar observer regen.
                    $data['embedding'] = null;
                }

                // Pakai Eloquent supaya observer `KnowledgeItemObserver` terpanggil.
                KnowledgeItem::query()->updateOrCreate(
                    ['title' => $title],
                    $data,
                );
            }
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}
