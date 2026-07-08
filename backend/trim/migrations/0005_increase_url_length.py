from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trim', '0004_url_owner'),
    ]

    operations = [
        # Increase original_url from 200 → 2000 characters
        migrations.AlterField(
            model_name='url',
            name='original_url',
            field=models.URLField(max_length=2000),
        ),
        # Increase referrer from 200 → 2000 characters
        migrations.AlterField(
            model_name='click',
            name='referrer',
            field=models.URLField(max_length=2000, null=True, blank=True),
        ),
    ]
